# storage.py
from typing import Dict, List
from game_engine import GameState, create_new_game

_games: Dict[str, GameState] = {}


def create_game() -> GameState:
    game = create_new_game()
    _games[game.id] = game
    return game


def get_game(game_id: str) -> GameState:
    game = _games.get(game_id)
    if not game:
        raise KeyError(f"Game {game_id} not found")
    return game


def list_games() -> List[GameState]:
    return list(_games.values())
