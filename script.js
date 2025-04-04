// Game elements
const cardsContainer = document.getElementById('cards-container');
const playedCardsContainer = document.getElementById('played-cards-container');
const playBtn = document.getElementById('play-btn');
const discardBtn = document.getElementById('discard-btn');
const sortBtn = document.getElementById('sort-btn');
const payoutBtn = document.getElementById('payout-btn');
const messageElement = document.getElementById('message');
const scoreElement = document.getElementById('score');
const handsCounterElement = document.getElementById('hands-counter');
const modal = document.getElementById('payout-modal');
const closeBtn = document.querySelector('.close');
const discardCounterElement = document.getElementById('discard-counter');
const currentHandPointsElement = document.getElementById('current-hand-points');

// Game state
let deck = [];
let currentHand = [];
let selectedCards = [];
let score = 0;
let isProcessing = false;
let sortOrder = 'ascending'; // Track the current sort order
let handsPlayed = 0; // Track number of hands played
let discardsUsed = 0; // Track number of discards used
const MAX_HANDS = 5; // Maximum number of hands allowed
const MAX_DISCARDS = 3; // Maximum number of discards allowed
const WIN_THRESHOLD = 500; // Points needed to win
let isResetting = false;

// Payout values for different hands
const payouts = {
    royalFlush: 800,
    straightFlush: 500,
    fourOfAKind: 250,
    fullHouse: 150,
    flush: 100,
    straight: 80,
    threeOfAKind: 50,
    twoPair: 25,
    jacksOrBetter: 10
};

// Card values and suits
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
const suits = ['clubs', 'diamonds', 'hearts', 'spades'];

// Initialize the game
function initGame() {
    createDeck();
    shuffleDeck();
    updateScore();
    
    // Set initial sort button text
    sortBtn.textContent = 'Sort ↑';
    
    // Remove any existing event listeners first
    playBtn.removeEventListener('click', playHand);
    discardBtn.removeEventListener('click', discardSelectedCards);
    sortBtn.removeEventListener('click', sortCards);
    payoutBtn.removeEventListener('click', showPayoutTable);
    closeBtn.removeEventListener('click', hidePayoutTable);
    
    // Add event listeners
    playBtn.addEventListener('click', playHand);
    discardBtn.addEventListener('click', discardSelectedCards);
    sortBtn.addEventListener('click', sortCards);
    payoutBtn.addEventListener('click', showPayoutTable);
    closeBtn.addEventListener('click', hidePayoutTable);
    
    // Close modal when clicking outside
    const modalClickHandler = (event) => {
        if (event.target === modal) {
            hidePayoutTable();
        }
    };
    window.removeEventListener('click', modalClickHandler);
    window.addEventListener('click', modalClickHandler);
    
    // Deal initial hand automatically
    dealNewHand();
}

// Create a standard deck of 52 cards
function createDeck() {
    deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({
                suit,
                value,
                imgSrc: `cards/${suit}_${value}.png`
            });
        }
    }
}

// Shuffle the deck using Fisher-Yates algorithm
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Add new function to handle game end conditions
function checkGameEnd() {
    if (handsPlayed >= MAX_HANDS) {
        if (score >= WIN_THRESHOLD) {
            showMessage(`Congratulations! You won with ${score} points! Starting new game...`, 'win');
        } else {
            showMessage(`Game Over! You scored ${score} points. Starting new game...`, 'lose');
        }
        
        // Use requestAnimationFrame to ensure smooth transition
        requestAnimationFrame(() => {
            setTimeout(() => {
                resetGame();
            }, 2000);
        });
        return true;
    }
    return false;
}

// Modify dealNewHand to remove game end check
function dealNewHand() {
    console.log('Starting dealNewHand...');
    if (isProcessing) {
        console.log('Deal blocked - game is processing');
        return;
    }
    
    isProcessing = true;
    console.log('Set isProcessing to true');
    
    // Ensure we have enough cards
    if (deck.length < 9) {
        console.log('Deck too small, creating new deck');
        createDeck();
        shuffleDeck();
    }
    
    // Reset the current hand and selection
    currentHand = [];
    selectedCards = [];
    console.log('Reset currentHand and selectedCards');
    
    // Clear both card containers
    cardsContainer.innerHTML = '';
    playedCardsContainer.innerHTML = '';
    console.log('Cleared card containers');
    
    hideMessage();
    
    // Deal 9 cards
    console.log('Starting to deal 9 cards');
    for (let i = 0; i < 9; i++) {
        const card = deck.pop();
        currentHand.push(card);
        console.log(`Dealt card ${i + 1}: ${card.value} of ${card.suit}`);
    }
    
    // Sort the cards according to current sort order
    sortCurrentHand();
    console.log('Sorted cards');
    
    // Display the sorted cards
    displayCards();
    console.log('Displayed cards');
    
    // Reset buttons
    playBtn.disabled = true;
    discardBtn.disabled = true;
    console.log('Reset button states');
    
    isProcessing = false;
    console.log('Set isProcessing to false');
    console.log('dealNewHand complete. Current state:', { 
        currentHandLength: currentHand.length, 
        deckLength: deck.length,
        isResetting 
    });
}

// Display the current hand of cards
function displayCards() {
    cardsContainer.innerHTML = '';
    for (let i = 0; i < currentHand.length; i++) {
        const cardElement = createCardElement(currentHand[i], i);
        cardsContainer.appendChild(cardElement);
    }
}

// Create a card element
function createCardElement(card, index) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = card.imgSrc;
    img.alt = `${card.value} of ${card.suit}`;
    
    cardElement.appendChild(img);
    
    // Add click event to select/deselect card
    cardElement.addEventListener('click', () => toggleCardSelection(cardElement, index));
    
    return cardElement;
}

// Toggle card selection
function toggleCardSelection(cardElement, index) {
    if (isProcessing) return;
    
    cardElement.classList.toggle('selected');
    
    const cardIndex = selectedCards.indexOf(index);
    if (cardIndex === -1) {
        selectedCards.push(index);
    } else {
        selectedCards.splice(cardIndex, 1);
    }
    
    // Update button states based on selection
    updateButtonStates();
}

// Discard selected cards and deal new ones
function discardSelectedCards() {
    if (isProcessing) return;
    if (selectedCards.length === 0 || selectedCards.length > 5) return;
    if (discardsUsed >= MAX_DISCARDS) {
        showMessage(`No more discards available! You've used all ${MAX_DISCARDS} discards.`, 'lose');
        // Hide the message after 2 seconds
        setTimeout(() => {
            hideMessage();
        }, 2000);
        return;
    }
    
    isProcessing = true;
    discardBtn.disabled = true;
    playBtn.disabled = true;
    
    // Increment discard counter
    discardsUsed++;
    updateDiscardCounter();
    
    // Store the indices and elements for later use
    const indices = [...selectedCards]; // Create a copy
    const cardElements = indices.map(index => 
        document.querySelector(`.card[data-index="${index}"]`)
    );
    
    // Prepare cards for transition - add will-change for better performance
    cardElements.forEach(card => {
        // Force layout recalculation for each card before adding the class
        void card.offsetWidth;
        card.classList.add('fade-out');
    });
    
    // Wait for all cards to fade out
    setTimeout(() => {
        // Replace the selected cards with new ones
        for (const index of indices) {
            if (deck.length === 0) {
                createDeck();
                shuffleDeck();
            }
            
            const newCard = deck.pop();
            currentHand[index] = newCard;
        }
        
        // Sort the cards according to current sort order
        sortCurrentHand();
        
        // Display all cards
        displayCards();
        
        // Reset selection
        selectedCards = [];
        
        // After 2 seconds, re-enable interaction
        setTimeout(() => {
            isProcessing = false;
            playBtn.disabled = true;
            discardBtn.disabled = true;
        }, 2000);
    }, 800); // Wait for fade-out to complete
}

// Helper function to get card value for scoring
function getCardScoreValue(value) {
    if (value === 'jack' || value === 'queen' || value === 'king') return 10;
    if (value === 'ace') return 11;
    return parseInt(value);
}

// Add function to update current hand points display
function updateCurrentHandPoints(points) {
    currentHandPointsElement.textContent = points;
}

// Modify playHand function to update current hand points
function playHand() {
    if (isProcessing || selectedCards.length === 0) return;
    isProcessing = true;

    // Reset current hand points
    updateCurrentHandPoints(0);

    // Clear the played cards container
    playedCardsContainer.innerHTML = '';

    // Create a copy of the selected cards
    const playedCards = selectedCards.map(index => currentHand[index]);

    // Store original positions for animation
    const originalPositions = [];
    
    // Animate the selected cards (slide up)
    selectedCards.sort((a, b) => a - b); // Sort in ascending order
    for (let i = selectedCards.length - 1; i >= 0; i--) {
        const index = selectedCards[i];
        const cardElement = cardsContainer.children[index];
        
        // Store card details for animation
        originalPositions.push({
            card: currentHand[index],
            rect: cardElement.getBoundingClientRect()
        });
        
        // Remove the card from the current hand
        currentHand.splice(index, 1);
        
        // Remove the card element from the UI
        cardElement.remove();
    }
    
    // Redisplay remaining cards to update their positions
    displayCards();
    
    // Create and add played cards with animation
    originalPositions.forEach(({card, rect}) => {
        const cardElement = createCardElement(card);
        
        // Style for animation start position (absolute positioning relative to viewport)
        cardElement.style.position = 'fixed';
        cardElement.style.left = `${rect.left}px`;
        cardElement.style.top = `${rect.top}px`;
        cardElement.style.width = `${rect.width}px`;
        cardElement.style.height = `${rect.height}px`;
        cardElement.style.margin = '0';
        cardElement.style.zIndex = '100';
        cardElement.style.transition = 'transform 0.5s ease, top 0.5s ease';
        
        // Add to played cards container
        playedCardsContainer.appendChild(cardElement);
        
        // Force reflow
        void cardElement.offsetWidth;
        
        // Calculate destination position
        const destRect = playedCardsContainer.getBoundingClientRect();
        const destTop = destRect.top + playedCardsContainer.clientHeight / 2 - rect.height / 2;
        
        // Start animation
        cardElement.style.top = `${destTop}px`;
    });

    // After animation completes, normalize card positions and evaluate the hand
    setTimeout(() => {
        // Reset card styling to normal layout
        playedCardsContainer.innerHTML = '';
        
        // Sort played cards according to current sort order
        const sortedPlayedCards = [...playedCards].sort((a, b) => {
            const valueA = getCardValue(a.value);
            const valueB = getCardValue(b.value);
            return sortOrder === 'ascending' ? valueA - valueB : valueB - valueA;
        });
        
        // Display sorted cards
        sortedPlayedCards.forEach(card => {
            const cardElement = createCardElement(card);
            playedCardsContainer.appendChild(cardElement);
        });

        // Evaluate the hand
        const result = evaluateHand(playedCards);
        
        // Calculate card value points only for cards in the winning hand
        const cardPoints = result.win ? result.winningCards.reduce((total, card) => total + getCardScoreValue(card.value), 0) : 0;
        
        // Show individual card scores sequentially
        let currentIndex = 0;
        const showNextCardScore = () => {
            if (currentIndex < sortedPlayedCards.length) {
                const card = sortedPlayedCards[currentIndex];
                const cardElement = playedCardsContainer.children[currentIndex];
                
                // Only show score if the card is part of the winning hand
                if (result.win && result.winningCards.some(winningCard => 
                    winningCard.suit === card.suit && winningCard.value === card.value)) {
                    const score = getCardScoreValue(card.value);
                    
                    // Create and show score element
                    const scoreElement = document.createElement('div');
                    scoreElement.className = 'card-score';
                    scoreElement.textContent = `+${score}`;
                    cardElement.appendChild(scoreElement);
                    
                    // Update current hand points
                    const currentPoints = parseInt(currentHandPointsElement.textContent);
                    updateCurrentHandPoints(currentPoints + score);
                    
                    // Remove score after delay
                    setTimeout(() => {
                        scoreElement.remove();
                        currentIndex++;
                        showNextCardScore();
                    }, 800);
                } else {
                    // Skip scoring for non-winning cards
                    currentIndex++;
                    showNextCardScore();
                }
            } else {
                // All cards scored, show total result
                if (result.win) {
                    const totalPoints = result.points + cardPoints;
                    score += totalPoints;
                    updateScore();
                    showMessage(`${result.handName}! You won ${result.points} points for the hand plus ${cardPoints} points for the cards!`, 'win');
                } else {
                    showMessage('Not a winning hand. Try again!', 'lose');
                }
                
                // Increment hands played
                handsPlayed++;
                updateHandsCounter();
                
                // Check for game end
                if (checkGameEnd()) {
                    return;
                }
                
                // After a 2 second delay, deal new cards to replace the played ones
                setTimeout(() => {
                    // Reset selection
                    selectedCards = [];
                    
                    // Clear the message and played cards
                    hideMessage();
                    playedCardsContainer.innerHTML = '';
                    
                    // Reset current hand points
                    updateCurrentHandPoints(0);
                    
                    // Deal new cards to replace the played ones
                    if (deck.length < sortedPlayedCards.length) {
                        createDeck();
                        shuffleDeck();
                    }
                    
                    // Add new cards to the current hand
                    for (let i = 0; i < sortedPlayedCards.length; i++) {
                        const newCard = deck.pop();
                        currentHand.push(newCard);
                    }
                    
                    // Sort the cards according to current sort order
                    sortCurrentHand();
                    
                    // Display the updated hand
                    displayCards();
                    
                    // Reset isProcessing flag
                    isProcessing = false;
                    
                    // Update button states
                    updateButtonStates();
                }, 2000);
            }
        };
        
        // Start showing hand points first, then card scores
        if (result.win) {
            // Show hand points first
            const handScoreElement = document.createElement('div');
            handScoreElement.className = 'hand-score';
            handScoreElement.textContent = `${result.handName}: +${result.points}`;
            playedCardsContainer.appendChild(handScoreElement);
            
            // Update current hand points with hand value
            updateCurrentHandPoints(result.points);
            
            // Remove hand score and start showing card scores
            setTimeout(() => {
                handScoreElement.remove();
                showNextCardScore();
            }, 800);
        } else {
            showNextCardScore();
        }
    }, 600); // Slightly longer delay to complete sliding animation
}

// Evaluate a hand to determine if it's a winning poker hand
function evaluateHand(cards) {
    // Convert card values to numbers for easier comparison
    const cardValues = cards.map(card => {
        let value = card.value;
        if (value === 'jack') return 11;
        if (value === 'queen') return 12;
        if (value === 'king') return 13;
        if (value === 'ace') return 14;
        return parseInt(value);
    });
    
    const suits = cards.map(card => card.suit);
    
    // Sort values in ascending order
    cardValues.sort((a, b) => a - b);
    
    // Check for different poker hands
    
    // Check for flush (exactly 5 cards of same suit)
    const suitCounts = {};
    for (const suit of suits) {
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    }
    const isFlush = Object.values(suitCounts).includes(5);
    
    // Check for straight (exactly 5 consecutive values)
    let isStraight = false;
    if (cardValues.length === 5) {
        isStraight = true;
        for (let i = 1; i < cardValues.length; i++) {
            if (cardValues[i] !== cardValues[i-1] + 1) {
                isStraight = false;
                break;
            }
        }
        
        // Special case for A-5 straight
        if (!isStraight && cardValues.join(',') === '2,3,4,5,14') {
            isStraight = true;
        }
    }
    
    // Count occurrences of each value
    const valueCounts = {};
    for (const value of cardValues) {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
    }
    
    const counts = Object.values(valueCounts);
    
    // Royal flush
    if (isFlush && isStraight && cardValues[0] === 10) {
        const winningCards = cards.filter(card => {
            const value = getCardValue(card.value);
            return value >= 10;
        });
        return { win: true, handName: 'Royal Flush', points: payouts.royalFlush, winningCards };
    }
    
    // Straight flush
    if (isFlush && isStraight) {
        const winningCards = cards.filter(card => {
            const value = getCardValue(card.value);
            return value >= cardValues[0] && value <= cardValues[cardValues.length - 1];
        });
        return { win: true, handName: 'Straight Flush', points: payouts.straightFlush, winningCards };
    }
    
    // Four of a kind
    if (counts.includes(4)) {
        const fourValue = Object.entries(valueCounts).find(([_, count]) => count === 4)[0];
        const winningCards = cards.filter(card => getCardValue(card.value) === parseInt(fourValue));
        return { win: true, handName: 'Four of a Kind', points: payouts.fourOfAKind, winningCards };
    }
    
    // Full house (three of a kind and a pair)
    if (counts.includes(3) && counts.includes(2)) {
        const threeValue = Object.entries(valueCounts).find(([_, count]) => count === 3)[0];
        const pairValue = Object.entries(valueCounts).find(([_, count]) => count === 2)[0];
        const winningCards = cards.filter(card => {
            const value = getCardValue(card.value);
            return value === parseInt(threeValue) || value === parseInt(pairValue);
        });
        return { win: true, handName: 'Full House', points: payouts.fullHouse, winningCards };
    }
    
    // Flush (must be exactly 5 cards of same suit)
    if (isFlush) {
        const flushSuit = Object.entries(suitCounts).find(([_, count]) => count === 5)[0];
        const winningCards = cards.filter(card => card.suit === flushSuit);
        return { win: true, handName: 'Flush', points: payouts.flush, winningCards };
    }
    
    // Straight (must be exactly 5 consecutive cards)
    if (isStraight) {
        const winningCards = cards.filter(card => {
            const value = getCardValue(card.value);
            return value >= cardValues[0] && value <= cardValues[cardValues.length - 1];
        });
        return { win: true, handName: 'Straight', points: payouts.straight, winningCards };
    }
    
    // Three of a kind
    if (counts.includes(3)) {
        const threeValue = Object.entries(valueCounts).find(([_, count]) => count === 3)[0];
        const winningCards = cards.filter(card => getCardValue(card.value) === parseInt(threeValue));
        return { win: true, handName: 'Three of a Kind', points: payouts.threeOfAKind, winningCards };
    }
    
    // Two pair
    if (counts.filter(count => count === 2).length === 2) {
        const pairValues = Object.entries(valueCounts)
            .filter(([_, count]) => count === 2)
            .map(([value]) => parseInt(value));
        const winningCards = cards.filter(card => pairValues.includes(getCardValue(card.value)));
        return { win: true, handName: 'Two Pair', points: payouts.twoPair, winningCards };
    }
    
    // Jacks or better (pair of jacks, queens, kings, or aces)
    if (counts.includes(2)) {
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 2 && parseInt(value) >= 11) {
                const winningCards = cards.filter(card => getCardValue(card.value) === parseInt(value));
                return { win: true, handName: 'Jacks or Better', points: payouts.jacksOrBetter, winningCards };
            }
        }
    }
    
    // Not a winning hand
    return { win: false };
}

// Show message
function showMessage(text, type = '') {
    messageElement.textContent = text;
    messageElement.className = 'message show';
    if (type) {
        messageElement.classList.add(type);
    }
}

// Hide message
function hideMessage() {
    messageElement.className = 'message';
    messageElement.textContent = '';
}

// Update score display
function updateScore() {
    scoreElement.textContent = score;
}

// Helper function to convert card values to numeric values for sorting
function getCardValue(value) {
    if (value === 'jack') return 11;
    if (value === 'queen') return 12;
    if (value === 'king') return 13;
    if (value === 'ace') return 14;
    return parseInt(value);
}

// Function to sort cards by rank
function sortCards() {
    if (isProcessing || currentHand.length === 0) return;
    
    isProcessing = true;
    
    // Store the selected cards
    const selectedCardValues = selectedCards.map(index => currentHand[index]);
    
    // Toggle sort order
    sortOrder = sortOrder === 'ascending' ? 'descending' : 'ascending';
    
    // Update the sort button text to indicate current order
    sortBtn.textContent = sortOrder === 'ascending' ? 'Sort ↑' : 'Sort ↓';
    
    // Sort the hand by rank using the helper function
    sortCurrentHand();
    
    // Redraw the cards
    displayCards();
    
    // Reselect the same cards based on their values
    selectedCards = [];
    selectedCardValues.forEach(selectedCard => {
        // Find the new index of the selected card after sorting
        const newIndex = currentHand.findIndex(card => 
            card.suit === selectedCard.suit && card.value === selectedCard.value
        );
        
        if (newIndex !== -1) {
            selectedCards.push(newIndex);
            const cardElement = document.querySelector(`.card[data-index="${newIndex}"]`);
            if (cardElement) {
                cardElement.classList.add('selected');
            }
        }
    });
    
    // Update button states based on selection
    updateButtonStates();
    
    isProcessing = false;
}

// Update button states based on selection
function updateButtonStates() {
    const selectionCount = selectedCards.length;
    playBtn.disabled = selectionCount === 0 || selectionCount > 5;
    discardBtn.disabled = selectionCount === 0 || selectionCount > 5;
}

// Function to sort the current hand based on the current sort order
function sortCurrentHand() {
    if (sortOrder === 'ascending') {
        currentHand.sort((a, b) => getCardValue(a.value) - getCardValue(b.value));
    } else {
        currentHand.sort((a, b) => getCardValue(b.value) - getCardValue(a.value));
    }
}

// Show payout table modal
function showPayoutTable() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

// Hide payout table modal
function hidePayoutTable() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Update hands counter display
function updateHandsCounter() {
    handsCounterElement.textContent = MAX_HANDS - handsPlayed;
}

// Add function to update discard counter display
function updateDiscardCounter() {
    discardCounterElement.textContent = MAX_DISCARDS - discardsUsed;
}

// Reset the game state
function resetGame() {
    console.log('Starting game reset...');
    console.log('Current state:', { score, handsPlayed, deckLength: deck.length });
    
    isResetting = true;
    console.log('Set isResetting to true');
    
    // Reset game state
    score = 0;
    handsPlayed = 0;
    discardsUsed = 0; // Reset discard counter
    updateCurrentHandPoints(0); // Reset current hand points
    console.log('Reset score, handsPlayed, and discardsUsed to 0');
    
    // Update UI
    updateScore();
    updateHandsCounter();
    updateDiscardCounter(); // Update discard counter display
    console.log('Updated UI displays');
    
    // Clear UI elements
    hideMessage();
    cardsContainer.innerHTML = '';
    playedCardsContainer.innerHTML = '';
    console.log('Cleared UI elements');
    
    // Reset deck
    createDeck();
    shuffleDeck();
    console.log('Created and shuffled new deck. Deck length:', deck.length);
    
    // Ensure processing is false before dealing new hand
    isProcessing = false;
    
    // Deal new hand
    console.log('Calling dealNewHand...');
    dealNewHand();
    
    isResetting = false;
    console.log('Reset complete. Final state:', { score, handsPlayed, deckLength: deck.length });
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame); 