# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS

from storage import create_game, get_game
from game_engine import GameState, add_player, start_game, play_card

app = Flask(__name__)
CORS(app)  # שיהיה לך קל כשנוסיף פרונטנד בהמשך


    

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
    }


@app.route("/rooms", methods=["POST"])
def api_create_room():
    game = create_game()
    return jsonify({"roomId": game.id}), 201


@app.route("/rooms/<room_id>/join", methods=["POST"])
def api_join_room(room_id):
    print("RAW DATA:", repr(request.data))
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
    
    # --- שינוי: תמיכה ברשימה או בבודד ---
    card_ids = data.get("cardIds") # נצפה לרשימה
    if not card_ids:
        # תמיכה לאחור במקרה שהפרונט שולח בודד
        single_id = data.get("cardId")
        if single_id:
            card_ids = [single_id]
    # -------------------------------------

    target_card_id = data.get("targetCardId")

    if not player_id or not card_ids:
        return jsonify({"error": "playerId and cardIds are required"}), 400

    try:
        game = get_game(room_id)
        # קריאה לפונקציה המעודכנת
        play_card(game, player_id, card_ids, target_card_id=target_card_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(game_to_dict(game))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # אפשר לשנות host ל-0.0.0.0 אם תרצה גישה ממכונות אחרות ברשת
    app.run(debug=True)
