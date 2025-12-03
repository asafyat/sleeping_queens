from flask import Flask, request, jsonify
from flask_cors import CORS

# Assuming you will update these functions in storage.py/game_engine.py to accept api_key
from storage import create_game, get_game
from game_engine import GameState, add_player, start_game, play_card

app = Flask(__name__)
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

@app.route("/rooms/<room_id>/play", methods=["POST"])
def api_play_card(room_id):
    data = request.get_json(force=True) or {}
    player_id = data.get("playerId")
    
    # --- Support for List or Single ID ---
    card_ids = data.get("cardIds") 
    if not card_ids:
        single_id = data.get("cardId")
        if single_id:
            card_ids = [single_id]
    # -------------------------------------

    target_card_id = data.get("targetCardId")

    if not player_id or not card_ids:
        return jsonify({"error": "playerId and cardIds are required"}), 400

    try:
        game = get_game(room_id)
        play_card(game, player_id, card_ids, target_card_id=target_card_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(game_to_dict(game))

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)