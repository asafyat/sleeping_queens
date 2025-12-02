# game_engine.py
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
import uuid
import random

# -----------------------------------------------------------------------------
# Data Structures
# -----------------------------------------------------------------------------

@dataclass
class Card:
    id: str
    type: str        # "queen", "king", "knight", "potion", "dragon", "wand", "number", "jester"
    value: int = 0   # numbers (1-10)
    name: str = ""   # Queens (e.g. "Rose Queen")

@dataclass
class Player:
    id: str
    name: str
    hand: List[Card] = field(default_factory=list)
    score: int = 0

@dataclass
class GameState:
    id: str
    players: Dict[str, Player] = field(default_factory=dict)
    turn_player_id: Optional[str] = None
    
    deck: List[Card] = field(default_factory=list)
    discard_pile: List[Card] = field(default_factory=list)
    
    queens_sleeping: List[Card] = field(default_factory=list)
    queens_awake: Dict[str, List[Card]] = field(default_factory=dict)
    
    started: bool = False
    last_action_message: str = ""
    winner_id: Optional[str] = None
    
    # State for Rose Queen Bonus
    pending_rose_wake: bool = False


# -----------------------------------------------------------------------------
# Deck Building
# -----------------------------------------------------------------------------

def _build_deck() -> List[Card]:
    cards: List[Card] = []
    
    # 1. Queens
    queens_data = [
        ("Rose Queen", 5), ("Dog Queen", 15), ("Cat Queen", 15),
        ("Sunflower Queen", 10), ("Rainbow Queen", 10), ("Moon Queen", 10),
        ("Star Queen", 10), ("Heart Queen", 15), ("Pancake Queen", 15),
        ("Ice Cream Queen", 20),
    ]
    for name, val in queens_data:
        cards.append(Card(id=str(uuid.uuid4()), type="queen", value=val, name=name))

    # 2. Action Cards
    for _ in range(8): cards.append(Card(id=str(uuid.uuid4()), type="king"))
    for _ in range(4): cards.append(Card(id=str(uuid.uuid4()), type="knight"))
    for _ in range(4): cards.append(Card(id=str(uuid.uuid4()), type="potion"))
    for _ in range(3): cards.append(Card(id=str(uuid.uuid4()), type="dragon"))
    for _ in range(3): cards.append(Card(id=str(uuid.uuid4()), type="wand"))
    
    # --- New: 4 Jesters ---
    for _ in range(4): cards.append(Card(id=str(uuid.uuid4()), type="jester"))

    # 3. Number Cards
    for value in range(1, 11):
        for _ in range(4):
            cards.append(Card(id=str(uuid.uuid4()), type="number", value=value))

    random.shuffle(cards)
    return cards


# -----------------------------------------------------------------------------
# Helper Functions (Logic)
# -----------------------------------------------------------------------------

def _next_player_id(game: GameState) -> str:
    player_ids = list(game.players.keys())
    if not player_ids: return ""
    if not game.turn_player_id: return player_ids[0]
    try:
        idx = player_ids.index(game.turn_player_id)
        return player_ids[(idx + 1) % len(player_ids)]
    except ValueError: return player_ids[0]

def _can_take_queen(player_queens: List[Card], new_queen: Card) -> bool:
    has_dog = any(q.name == "Dog Queen" for q in player_queens)
    has_cat = any(q.name == "Cat Queen" for q in player_queens)
    if new_queen.name == "Dog Queen" and has_cat: return False
    if new_queen.name == "Cat Queen" and has_dog: return False
    return True

def _find_opponent_queen(game: GameState, attacker_id: str, target_card_id: str) -> Tuple[Optional[str], Optional[Card]]:
    for pid, queens in game.queens_awake.items():
        if pid == attacker_id: continue
        found = next((q for q in queens if q.id == target_card_id), None)
        if found: return pid, found
    return None, None

def _validate_numbers_move(cards: List[Card]) -> bool:
    if len(cards) == 1: return True
    values = sorted([c.value for c in cards])
    if all(v == values[0] for v in values): return True # Pair/Triple
    if len(values) >= 3 and sum(values[:-1]) == values[-1]: return True # Equation
    return False

def _check_victory(game: GameState, player: Player):
    player_queens = game.queens_awake.get(player.id, [])
    current_score = sum(q.value for q in player_queens)
    player.score = current_score
    queen_count = len(player_queens)
    
    num_players = len(game.players)
    if num_players <= 3:
        if queen_count >= 5 or current_score >= 50:
            game.winner_id = player.id
            game.last_action_message = f"GAME OVER! {player.name} WINS!"
    else:
        if queen_count >= 4 or current_score >= 40:
            game.winner_id = player.id
            game.last_action_message = f"GAME OVER! {player.name} WINS!"

# --- New: Centralized Draw Function with Reshuffling ---
def _draw_cards(game: GameState, player: Player, count: int):
    for _ in range(count):
        if not game.deck:
            # Reshuffle Logic
            if not game.discard_pile:
                break # No cards left anywhere
            
            # Move discard to deck (shuffle)
            game.deck = game.discard_pile[:]
            game.discard_pile = []
            random.shuffle(game.deck)
            
        if game.deck:
            player.hand.append(game.deck.pop())

def _finish_turn(game: GameState, player: Player, cards_played: List[Card], message: str, extra_turn: bool = False):
    # 1. Discard played cards
    for c in cards_played:
        if c in player.hand:
            player.hand.remove(c)
            game.discard_pile.append(c)
    
    # 2. Draw new cards
    cards_needed = 5 - len(player.hand) # Always fill up to 5
    if cards_needed > 0:
        _draw_cards(game, player, cards_needed)

    # 3. Status
    game.last_action_message = message
    _check_victory(game, player)

    # 4. Handle Rose Bonus or Next Turn
    if game.pending_rose_wake:
        game.last_action_message += " (Rose Bonus: Pick another!)"
        return

    if not game.winner_id and not extra_turn:
        game.turn_player_id = _next_player_id(game)


# -----------------------------------------------------------------------------
# Specific Card Handlers
# -----------------------------------------------------------------------------

def _handle_numbers(player: Player, cards: List[Card]) -> str:
    if not _validate_numbers_move(cards):
        raise ValueError("Invalid number combination.")
    values = [str(c.value) for c in cards]
    return f"{player.name} discarded numbers: {', '.join(values)}"


def _handle_king(game: GameState, player: Player, target_card_id: str) -> str:
    if not target_card_id: raise ValueError("Select a sleeping queen")
    target_queen = next((c for c in game.queens_sleeping if c.id == target_card_id), None)
    if not target_queen: raise ValueError("Target not sleeping")
    
    if not _can_take_queen(game.queens_awake[player.id], target_queen):
        raise ValueError(f"Cannot take {target_queen.name} (Animal conflict)")

    game.queens_sleeping.remove(target_queen)
    game.queens_awake[player.id].append(target_queen)
    
    if target_queen.name == "Rose Queen":
        game.pending_rose_wake = True
        
    return f"{player.name} woke up {target_queen.name}!"


def _handle_knight(game: GameState, player: Player, target_card_id: str) -> str:
    if not target_card_id: raise ValueError("Select opponent queen")
    target_owner_id, target_queen = _find_opponent_queen(game, player.id, target_card_id)
    if not target_queen: raise ValueError("Queen not found")

    if not _can_take_queen(game.queens_awake[player.id], target_queen):
        raise ValueError(f"Cannot steal {target_queen.name} (Animal conflict)")

    opponent = game.players[target_owner_id]
    defense_card = next((c for c in opponent.hand if c.type == "dragon"), None)

    if defense_card:
        opponent.hand.remove(defense_card)
        game.discard_pile.append(defense_card)
        _draw_cards(game, opponent, 1) # Opponent draws immediately
        return f"Attack blocked! {opponent.name} used Dragon!"
    else:
        game.queens_awake[target_owner_id].remove(target_queen)
        game.queens_awake[player.id].append(target_queen)
        return f"{player.name} stole {target_queen.name} from {opponent.name}!"


def _handle_potion(game: GameState, player: Player, target_card_id: str) -> str:
    if not target_card_id: raise ValueError("Select opponent queen")
    target_owner_id, target_queen = _find_opponent_queen(game, player.id, target_card_id)
    if not target_queen: raise ValueError("Queen not found")

    opponent = game.players[target_owner_id]
    defense_card = next((c for c in opponent.hand if c.type == "wand"), None)

    if defense_card:
        opponent.hand.remove(defense_card)
        game.discard_pile.append(defense_card)
        _draw_cards(game, opponent, 1)
        return f"Attack blocked! {opponent.name} used Wand!"
    else:
        game.queens_awake[target_owner_id].remove(target_queen)
        game.queens_sleeping.append(target_queen)
        return f"{player.name} put {opponent.name}'s Queen to sleep!"


# --- New: Jester Handler ---
def _handle_jester(game: GameState, player: Player) -> Tuple[str, bool]:
    """Returns (Message, ExtraTurnBoolean)"""
    
    # 1. Reveal Card
    if not game.deck:
        if not game.discard_pile:
            return "Jester played but deck is empty!", False
        # Reshuffle manually here since we need to peek
        game.deck = game.discard_pile[:]
        game.discard_pile = []
        random.shuffle(game.deck)
        
    revealed_card = game.deck.pop()
    
    # 2. Logic
    msg = f"{player.name} played Jester and revealed: {revealed_card.type} "
    if revealed_card.value: msg += str(revealed_card.value)
    
    extra_turn = False
    
    # Scenario A: Power Card (King, Knight, Potion, Dragon, Wand, Jester, Queen?)
    # Rules say: Add to hand and play again.
    if revealed_card.type != "number":
        player.hand.append(revealed_card)
        msg += ". It's a Power Card! You get it and play again."
        extra_turn = True
        
    # Scenario B: Number Card
    else:
        # Rules: Count players starting from current player.
        # The landing player gets to wake a queen.
        game.discard_pile.append(revealed_card) # Number is discarded
        
        count = revealed_card.value
        player_ids = list(game.players.keys())
        current_idx = player_ids.index(player.id)
        
        # Calculate target index (1=Me, 2=Next...)
        target_idx = (current_idx + count - 1) % len(player_ids)
        target_pid = player_ids[target_idx]
        target_player = game.players[target_pid]
        
        # Wake a random queen for target
        if game.queens_sleeping:
            # Try to find a valid queen (check dog/cat)
            valid_queen = None
            for q in game.queens_sleeping:
                if _can_take_queen(game.queens_awake[target_pid], q):
                    valid_queen = q
                    break
            
            if valid_queen:
                game.queens_sleeping.remove(valid_queen)
                game.queens_awake[target_pid].append(valid_queen)
                msg += f". Counted {count} to {target_player.name}, who woke {valid_queen.name}!"
                
                # Rose Queen check for the lucky winner
                if valid_queen.name == "Rose Queen":
                    # Special edge case: If it's NOT my turn, handling Rose is complex.
                    # For MVP: We will auto-wake another random one for them to avoid blocking game.
                    if game.queens_sleeping:
                        bonus_q = game.queens_sleeping.pop()
                        game.queens_awake[target_pid].append(bonus_q)
                        msg += f" (Rose Bonus: {target_player.name} also got {bonus_q.name}!)"
            else:
                msg += f". Counted to {target_player.name}, but they couldn't take any queen!"
        else:
            msg += ". No sleeping queens left!"
            
    return msg, extra_turn


# -----------------------------------------------------------------------------
# Main Game Management
# -----------------------------------------------------------------------------

def create_new_game() -> GameState:
    deck = _build_deck()
    game_id = str(uuid.uuid4())
    return GameState(id=game_id, deck=deck)

def add_player(game: GameState, name: str) -> Player:
    pid = str(uuid.uuid4())
    p = Player(id=pid, name=name)
    game.players[pid] = p
    game.queens_awake[pid] = []
    return p

def start_game(game: GameState):
    if game.started: return
    if not game.players: raise ValueError("Need players")
    
    new_deck = []
    for c in game.deck:
        if c.type == "queen": game.queens_sleeping.append(c)
        else: new_deck.append(c)
    game.deck = new_deck
    
    # Deal 5 cards
    for _ in range(5):
        for p in game.players.values():
            _draw_cards(game, p, 1)
            
    game.turn_player_id = next(iter(game.players.keys()))
    game.started = True

def get_game(game_id: str): pass 

def play_card(game: GameState, player_id: str, card_ids: List[str], target_card_id: Optional[str] = None) -> None:
    # 1. Pre-checks
    if not game.started: raise ValueError("Game not started")
    if player_id != game.turn_player_id: raise ValueError("Not your turn")
    player = game.players.get(player_id)
    if not player: raise ValueError("Unknown player")

    # === ROSE QUEEN BONUS STATE ===
    if game.pending_rose_wake:
        if not target_card_id: raise ValueError("Rose Bonus: Select sleeping queen!")
        target_queen = next((c for c in game.queens_sleeping if c.id == target_card_id), None)
        if not target_queen: raise ValueError("Target not sleeping")
        
        if not _can_take_queen(game.queens_awake[player.id], target_queen):
             raise ValueError(f"Cannot take {target_queen.name} (Animal conflict)")

        game.queens_sleeping.remove(target_queen)
        game.queens_awake[player.id].append(target_queen)
        game.pending_rose_wake = False 
        _finish_turn(game, player, [], f"{player.name} used Rose Bonus to wake {target_queen.name}!")
        return
    # ==============================

    # 2. Extract Cards
    if not card_ids: raise ValueError("No cards selected")
    cards_to_play = []
    for cid in card_ids:
        c = next((x for x in player.hand if x.id == cid), None)
        if not c: raise ValueError(f"Card not found")
        cards_to_play.append(c)

    # 3. Type Check
    first_type = cards_to_play[0].type
    if not all(c.type == first_type for c in cards_to_play):
        raise ValueError("Cannot mix card types")

    # 4. Routing
    action_result = ""
    extra_turn = False
    
    if first_type == "number":
        action_result = _handle_numbers(player, cards_to_play)
        
    else:
        if len(cards_to_play) > 1: raise ValueError("Special cards must be played singly")
        
        if first_type == "king": action_result = _handle_king(game, player, target_card_id)
        elif first_type == "knight": action_result = _handle_knight(game, player, target_card_id)
        elif first_type == "potion": action_result = _handle_potion(game, player, target_card_id)
        
        # --- Jester ---
        elif first_type == "jester":
            action_result, extra_turn = _handle_jester(game, player)
        # --------------
        
        elif first_type in ["dragon", "wand"]: raise ValueError("Cannot play defense aggressively")
        else: raise ValueError(f"Unknown card type: {first_type}")

    # 5. Finish
    _finish_turn(game, player, cards_to_play, action_result, extra_turn=extra_turn)