from typing import Dict, List, Optional
from game_engine import GameState, create_new_game

_games: Dict[str, GameState] = {}


def create_game(api_key: Optional[str] = None) -> GameState:
    """
    Creates a new game, optionally storing an API key for AI features.
    """
    # Pass the api_key to the game engine's creation function
    # Note: You must also update create_new_game() in game_engine.py to accept this argument!
    game = create_new_game(api_key=api_key)
    _games[game.id] = game
    return game


def get_game(game_id: str) -> GameState:
    game = _games.get(game_id)
    if not game:
        raise KeyError(f"Game {game_id} not found")
    return game


def list_games() -> List[GameState]:
    return list(_games.values())