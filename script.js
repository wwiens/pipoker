// Game elements
const cardsContainer = document.getElementById('cards-container');
const playBtn = document.getElementById('play-btn');
const discardBtn = document.getElementById('discard-btn');
const messageElement = document.getElementById('message');
const scoreElement = document.getElementById('score');

// Game state
let deck = [];
let currentHand = [];
let selectedCards = [];
let score = 0;
let isProcessing = false;

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
    
    // Event listeners
    playBtn.addEventListener('click', playHand);
    discardBtn.addEventListener('click', discardSelectedCards);
    
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

// Deal a new hand of 9 cards
function dealNewHand() {
    if (isProcessing) return;
    
    if (deck.length < 9) {
        createDeck();
        shuffleDeck();
    }
    
    currentHand = [];
    selectedCards = [];
    cardsContainer.innerHTML = '';
    hideMessage();
    
    // Deal 9 cards
    for (let i = 0; i < 9; i++) {
        const card = deck.pop();
        currentHand.push(card);
        
        const cardElement = createCardElement(card, i);
        cardsContainer.appendChild(cardElement);
    }
    
    // Reset buttons
    playBtn.disabled = true;
    discardBtn.disabled = true;
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
    
    // Enable/disable buttons based on selection
    const selectionCount = selectedCards.length;
    playBtn.disabled = selectionCount === 0 || selectionCount > 5;
    discardBtn.disabled = selectionCount === 0 || selectionCount > 5;
}

// Discard selected cards and deal new ones
function discardSelectedCards() {
    if (isProcessing) return;
    if (selectedCards.length === 0 || selectedCards.length > 5) return;
    
    isProcessing = true;
    discardBtn.disabled = true;
    playBtn.disabled = true;
    
    // Store the indices and elements for later use
    const indices = [...selectedCards]; // Create a copy
    const cardElements = indices.map(index => 
        document.querySelector(`.card[data-index="${index}"]`)
    );
    
    // First step: add fade-out class to all selected cards at once
    cardElements.forEach(card => {
        // Force layout recalculation for each card before adding the class
        void card.offsetWidth;
        card.classList.add('fade-out');
    });
    
    // Wait for all cards to fade out
    setTimeout(() => {
        // Second step: prepare all the new cards but keep them invisible
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i];
            const cardElement = cardElements[i];
            
            if (deck.length === 0) {
                createDeck();
                shuffleDeck();
            }
            
            const newCard = deck.pop();
            currentHand[index] = newCard;
            
            // Update image source but keep card invisible
            const img = cardElement.querySelector('img');
            img.src = newCard.imgSrc;
            img.alt = `${newCard.value} of ${newCard.suit}`;
            
            // Remove selection styling
            cardElement.classList.remove('selected');
            
            // Keep the card invisible but remove fade-out class
            // We'll manually control opacity
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.8)';
        }
        
        // Give the DOM time to update with new card images
        setTimeout(() => {
            // Third step: fade all cards back in simultaneously
            cardElements.forEach(card => {
                // Remove the fade-out class
                card.classList.remove('fade-out');
                
                // Force a reflow before starting the fade-in animation
                void card.offsetWidth;
                
                // Apply transition and fade in
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = '';
            });
            
            // Reset selection
            selectedCards = [];
            
            // Re-enable interaction after animations complete
            setTimeout(() => {
                isProcessing = false;
                playBtn.disabled = true;
                discardBtn.disabled = true;
                
                // Clean up inline styles
                cardElements.forEach(card => {
                    card.style.transition = '';
                });
            }, 800);
        }, 50);
    }, 800); // Wait for fade-out to complete
}

// Play the selected hand
function playHand() {
    if (isProcessing) return;
    if (selectedCards.length === 0 || selectedCards.length > 5) return;
    
    isProcessing = true;
    playBtn.disabled = true;
    discardBtn.disabled = true;
    
    // Get the selected cards
    const playedCards = selectedCards.map(index => currentHand[index]);
    
    // Evaluate the hand
    const result = evaluateHand(playedCards);
    
    // Display result and update score
    if (result.win) {
        score += result.points;
        updateScore();
        showMessage(`${result.handName}! You won ${result.points} points!`, 'win');
    } else {
        showMessage('Not a winning hand. Try again!', 'lose');
    }
    
    // Reset selection
    document.querySelectorAll('.card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    selectedCards = [];
    
    // Wait 2 seconds and deal a new hand
    setTimeout(() => {
        isProcessing = false;
        dealNewHand();
    }, 2000);
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
    
    // Check for flush (all same suit)
    const isFlush = suits.every(suit => suit === suits[0]);
    
    // Check for straight (consecutive values)
    let isStraight = true;
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
    
    // Royal flush
    if (isFlush && isStraight && cardValues[0] === 10) {
        return { win: true, handName: 'Royal Flush', points: payouts.royalFlush };
    }
    
    // Straight flush
    if (isFlush && isStraight) {
        return { win: true, handName: 'Straight Flush', points: payouts.straightFlush };
    }
    
    // Count occurrences of each value
    const valueCounts = {};
    for (const value of cardValues) {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
    }
    
    const counts = Object.values(valueCounts);
    
    // Four of a kind
    if (counts.includes(4)) {
        return { win: true, handName: 'Four of a Kind', points: payouts.fourOfAKind };
    }
    
    // Full house (three of a kind and a pair)
    if (counts.includes(3) && counts.includes(2)) {
        return { win: true, handName: 'Full House', points: payouts.fullHouse };
    }
    
    // Flush
    if (isFlush) {
        return { win: true, handName: 'Flush', points: payouts.flush };
    }
    
    // Straight
    if (isStraight) {
        return { win: true, handName: 'Straight', points: payouts.straight };
    }
    
    // Three of a kind
    if (counts.includes(3)) {
        return { win: true, handName: 'Three of a Kind', points: payouts.threeOfAKind };
    }
    
    // Two pair
    if (counts.filter(count => count === 2).length === 2) {
        return { win: true, handName: 'Two Pair', points: payouts.twoPair };
    }
    
    // Jacks or better (pair of jacks, queens, kings, or aces)
    if (counts.includes(2)) {
        for (const [value, count] of Object.entries(valueCounts)) {
            if (count === 2 && parseInt(value) >= 11) {
                return { win: true, handName: 'Jacks or Better', points: payouts.jacksOrBetter };
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

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame); 