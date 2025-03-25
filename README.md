# PiPoker - Card Game

A simple poker-style card game built with HTML, CSS, and JavaScript.

## Game Rules

1. The game automatically deals 9 cards when it starts
2. The player can select from 1 to 5 of the cards
3. After they make their selection, they can choose to discard the selected cards, or play them
4. If they discard them, only the selected cards will be replaced with new cards from the deck while unselected cards remain unchanged
5. If they play them, the hand is assessed to see if a successful poker hand was played
6. A message appears to tell the player if they won or lost
7. If they win, the value of the winning hand is added to the running score
8. After playing a hand, a new hand is automatically dealt after a 2-second delay

## Winning Hands and Payouts

| Hand           | Points |
|----------------|--------|
| Royal Flush    | 800    |
| Straight Flush | 500    |
| Four of a Kind | 250    |
| Full House     | 150    |
| Flush          | 100    |
| Straight       | 80     |
| Three of a Kind| 50     |
| Two Pair       | 25     |
| Jacks or Better| 10     |

Note: Pairs need to be Jacks or better (Jacks, Queens, Kings, or Aces) to win.

## How to Play

1. The game automatically deals cards when it loads
2. Click on 1 to 5 cards to select them
3. Click "Play Hand" to evaluate your selected cards as a poker hand
4. Click "Discard Selected" to replace only your selected cards with new ones while keeping others
5. After playing a hand, a new hand will be dealt automatically after a brief delay
6. Aim for the highest possible hand to maximize your score

## Implementation Details

- Uses a standard 52-card deck (no Jokers)
- Card images are from the CARDS folder
- Responsive design that works on both desktop and mobile devices

## To Run the Game

Simply open the index.html file in a web browser. 