from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

# Updated imports: Removed 'delete_game' to prevent startup crash if it's missing in storage.py
from storage import create_game, get_game
from game_engine import GameState, add_player, start_game, play_card

# --- CONFIGURATION: Serve React App ---
# We assume the React build is in a folder named 'dist' or 'build' 
# relative to this file. Change as needed.
static_folder_path = '../client/dist' 
if not os.path.exists(static_folder_path):
    static_folder_path = 'build' # Fallback for Create React App

app = Flask(__name__, static_folder=static_folder_path)
CORS(app)

def card_to_dict(card):
    return {
        "id": card.id,
        "type": card.type,
        "value": card.value,
        "name": card.name,
    }

def game_to_dict(game: GameState):
    return {
        "id": game.id,
        "lastMessage": game.last_action_message,
        "winnerId": game.winner_id,
        "pendingRoseWake": game.pending_rose_wake,
        "started": game.started,
        "turnPlayerId": game.turn_player_id,
        "discardPile": [card_to_dict(c) for c in game.discard_pile],
        "players": [
            {
                "id": p.id,
                "name": p.name,
                "score": p.score,
                "hand": [card_to_dict(c) for c in p.hand],
                "queensAwake": [
                    card_to_dict(c) for c in game.queens_awake.get(p.id, [])
                ],
            }
            for p in game.players.values()
        ],
        "queensSleeping": [card_to_dict(c) for c in game.queens_sleeping],
        "deckSize": len(game.deck),
        # --- NEW: Return API Key to clients so they can use AI ---
        # Using getattr to avoid errors if you haven't updated GameState yet
        "apiKey": getattr(game, 'api_key', None) 
    }

# --- NEW: List Rooms Endpoint ---
@app.route("/rooms", methods=["GET"])
def api_list_rooms():
    try:
        # Dynamic import to prevent crash if storage.py isn't updated
        from storage import get_all_games
        games = get_all_games()
        rooms_data = []
        for game in games:
            rooms_data.append({
                "id": game.id,
                "playerCount": len(game.players),
                "started": game.started,
                "winnerId": game.winner_id
            })
        return jsonify({"rooms": rooms_data})
    except ImportError:
        # Fallback if get_all_games is missing
        return jsonify({"rooms": []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/rooms", methods=["POST"])
def api_create_room():
    # --- NEW: Extract API Key ---
    data = request.get_json(force=True) or {}
    api_key = data.get("apiKey")
    
    # Note: You must update create_game() in storage.py to accept api_key
    try:
        game = create_game(api_key=api_key) 
    except TypeError:
        # Fallback if create_game hasn't been updated yet
        game = create_game()
        if api_key:
            game.api_key = api_key # Manual assignment if supported
            
    return jsonify({"roomId": game.id}), 201

@app.route("/rooms/<room_id>/join", methods=["POST"])
def api_join_room(room_id):
    data = request.get_json(force=True) or {}
    name = data.get("name") or "Player"
    try:
        game = get_game(room_id)
    except KeyError:
        return jsonify({"error": "Room not found"}), 404

    player = add_player(game, name)
    return jsonify({"playerId": player.id})

@app.route("/rooms/<room_id>/start", methods=["POST"])
def api_start_game(room_id):
    try:
        game = get_game(room_id)
    except KeyError:
        return jsonify({"error": "Room not found"}), 404

    try:
        start_game(game)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(game_to_dict(game))

@app.route("/rooms/<room_id>", methods=["GET"])
def api_get_state(room_id):
    try:
        game = get_game(room_id)
    except KeyError:
        return jsonify({"error": "Room not found"}), 404

    return jsonify(game_to_dict(game))

# --- NEW: Terminate Game Endpoint (Robust) ---
@app.route("/rooms/<room_id>", methods=["DELETE"])
def api_terminate_game(room_id):
    # Attempt to delete using storage functions
    try:
        # Check if delete_game is available in storage module
        from storage import delete_game
        delete_game(room_id)
        return jsonify({"message": "Game terminated"})
    except ImportError:
        # Fallback: Try to access the 'games' dictionary directly if delete_game is missing
        try:
            from storage import games
            if room_id in games:
                del games[room_id]
                return jsonify({"message": "Game terminated"})
            else:
                return jsonify({"error": "Room not found"}), 404
        except ImportError:
            return jsonify({"error": "Deletion not supported by storage backend"}), 501
    except KeyError:
        return jsonify({"error": "Room not found"}), 404

@app.route("/rooms/<room_id>/play", methods=["POST"])
def api_play_card(room_id):
    data = request.get_json(force=True) or {}
    player_id = data.get("playerId")
    
    # --- Support for List or Single ID ---
    card_ids = data.get("cardIds") 
    if not card_ids and card_ids is not None: 
        # If card_ids is an empty list [], that's fine (Rose Bonus uses this)
        pass
    elif not card_ids:
        # If card_ids is None or missing, try cardId or default to empty list
        single_id = data.get("cardId")
        if single_id:
            card_ids = [single_id]
        else:
            card_ids = []
    # -------------------------------------

    target_card_id = data.get("targetCardId")

    # FIXED: Relaxed validation. 
    # We only check for player_id. 
    # We allow empty card_ids because Rose Bonus moves send no cards.
    # The Game Engine logic will validate if cards are required for the specific move.
    if not player_id:
        return jsonify({"error": "playerId is required"}), 400

    try:
        game = get_game(room_id)
        play_card(game, player_id, card_ids, target_card_id=target_card_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(game_to_dict(game))

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# --- SERVE REACT FRONTEND ---
@app.route("/", defaults={'path': ''})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    app.run(debug=True)