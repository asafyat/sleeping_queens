import uuid
from game_engine import create_new_game, GameState

# In-memory storage for games
games = {}

def create_game(api_key=None):
    """Creates a new game using the engine's factory function."""
    game = create_new_game(api_key=api_key)
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

def get_all_games():
    """Returns a list of all active game objects."""
    return list(games.values())