import uuid
# We must import create_new_game to ensure the deck is built correctly
from game_engine import create_new_game, GameState

# In-memory storage for games
games = {}

def create_game(api_key=None):
    """Creates a new game using the engine's factory function."""
    # This uses the logic in game_engine.py to build the deck and setup the state
    game = create_new_game(api_key=api_key)
    
    # Optional: If you prefer short 6-char Room IDs like before, uncomment this line:
    # game.id = str(uuid.uuid4())[:6].upper()
    
    games[game.id] = game
    return game

def get_game(room_id):
    """Retrieves a game by ID."""
    if room_id not in games:
        raise KeyError(f"Game with ID {room_id} not found")
    return games[room_id]

def delete_game(room_id):
    """Removes a game from storage."""
    if room_id in games:
        del games[room_id]
    else:
        raise KeyError(f"Game with ID {room_id} not found")