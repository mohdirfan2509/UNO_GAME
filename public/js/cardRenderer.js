/**
 * UNO Multiplayer - Card Rendering
 */

class CardRenderer {
  constructor() {
    this.cardWidth = 60;
    this.cardHeight = 84;
    this.animationDuration = 300;
  }

  /**
   * Create a card element
   * @param {Object} card - Card object
   * @param {Object} options - Rendering options
   * @returns {HTMLElement} Card element
   */
  createCardElement(card, options = {}) {
    const {
      playable = false,
      selected = false,
      faceDown = false,
      size = 'normal',
      clickable = true,
      showValue = true
    } = options;

    const cardElement = document.createElement('div');
    cardElement.className = 'uno-card';
    cardElement.dataset.cardId = card.id;
    cardElement.dataset.cardColor = card.color;
    cardElement.dataset.cardValue = card.value;

    // Set size
    if (size === 'small') {
      cardElement.style.width = '40px';
      cardElement.style.height = '56px';
      cardElement.style.fontSize = '0.6rem';
    } else if (size === 'large') {
      cardElement.style.width = '80px';
      cardElement.style.height = '112px';
      cardElement.style.fontSize = '1.2rem';
    } else {
      cardElement.style.width = `${this.cardWidth}px`;
      cardElement.style.height = `${this.cardHeight}px`;
    }

    // Add color class
    cardElement.classList.add(card.color);

    // Add state classes
    if (playable) {
      cardElement.classList.add('playable');
    }
    if (selected) {
      cardElement.classList.add('selected');
    }
    if (faceDown) {
      cardElement.classList.add('face-down');
    }
    if (!clickable) {
      cardElement.classList.add('no-click');
    }

    // Create card content
    if (faceDown) {
      cardElement.innerHTML = this.createFaceDownContent();
    } else {
      cardElement.innerHTML = this.createFaceUpContent(card, showValue);
    }

    // Add click handler
    if (clickable) {
      cardElement.addEventListener('click', (e) => {
        this.handleCardClick(cardElement, card, e);
      });
    }

    return cardElement;
  }

  /**
   * Create face down card content
   * @returns {string} HTML content
   */
  createFaceDownContent() {
    return `
      <div class="card-back">
        <i class="fas fa-layer-group"></i>
      </div>
    `;
  }

  /**
   * Create face up card content
   * @param {Object} card - Card object
   * @param {boolean} showValue - Whether to show card value
   * @returns {string} HTML content
   */
  createFaceUpContent(card, showValue = true) {
    if (!showValue) {
      return '<div class="card-back"><i class="fas fa-layer-group"></i></div>';
    }

    const valueDisplay = this.getCardValueDisplay(card);
    const symbolDisplay = this.getCardSymbolDisplay(card);

    return `
      <div class="card-content">
        <div class="card-value">${valueDisplay}</div>
        <div class="card-symbol">${symbolDisplay}</div>
      </div>
    `;
  }

  /**
   * Get card value display
   * @param {Object} card - Card object
   * @returns {string} Value display
   */
  getCardValueDisplay(card) {
    if (card.isWild) {
      return card.value === 'wild' ? 'W' : 'W4';
    }
    
    const valueMap = {
      'skip': '⏭',
      'reverse': '↩',
      'draw2': '+2'
    };
    
    return valueMap[card.value] || card.value;
  }

  /**
   * Get card symbol display
   * @param {Object} card - Card object
   * @returns {string} Symbol display
   */
  getCardSymbolDisplay(card) {
    if (card.isWild) {
      return '★';
    }
    
    const symbolMap = {
      'skip': '⏭',
      'reverse': '↩',
      'draw2': '+2'
    };
    
    return symbolMap[card.value] || '';
  }

  /**
   * Handle card click
   * @param {HTMLElement} cardElement - Card element
   * @param {Object} card - Card object
   * @param {Event} event - Click event
   */
  handleCardClick(cardElement, card, event) {
    event.preventDefault();
    event.stopPropagation();

    // Check if card is playable
    if (!cardElement.classList.contains('playable')) {
      Utils.showToast('Cannot play this card', 'warning');
      Utils.vibrate([100, 50, 100]);
      return;
    }

    // Handle wild card color selection
    if (card.isWild) {
      this.showColorPicker(card, cardElement);
      return;
    }

    // Play the card
    this.playCard(card, cardElement);
  }

  /**
   * Show color picker for wild cards
   * @param {Object} card - Card object
   * @param {HTMLElement} cardElement - Card element
   */
  showColorPicker(card, cardElement) {
    const modal = new bootstrap.Modal(document.getElementById('colorPickerModal'));
    const colorButtons = document.querySelectorAll('.color-btn');
    
    // Clear previous selections
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Add click handlers
    colorButtons.forEach(btn => {
      btn.onclick = () => {
        const color = btn.dataset.color;
        this.playCard(card, cardElement, color);
        modal.hide();
      };
    });
    
    modal.show();
  }

  /**
   * Play a card
   * @param {Object} card - Card object
   * @param {HTMLElement} cardElement - Card element
   * @param {string} chosenColor - Chosen color for wild cards
   */
  playCard(card, cardElement, chosenColor = null) {
    const cardIndex = Array.from(cardElement.parentNode.children).indexOf(cardElement);
    
    // Animate card play
    this.animateCardPlay(cardElement);
    
    // Emit play card event
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.playCard(window.gameState.roomId, cardIndex, chosenColor);
    }
    
    // Play sound
    Utils.playSound('card-play');
    
    // Vibrate
    Utils.vibrate(50);
  }

  /**
   * Animate card play
   * @param {HTMLElement} cardElement - Card element
   */
  animateCardPlay(cardElement) {
    cardElement.classList.add('animate-card-play');
    
    setTimeout(() => {
      cardElement.classList.remove('animate-card-play');
    }, this.animationDuration);
  }

  /**
   * Render player hand
   * @param {Array} cards - Array of cards
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Rendering options
   */
  renderPlayerHand(cards, container, options = {}) {
    const {
      playableCards = [],
      selectedCard = null,
      size = 'normal',
      clickable = true
    } = options;

    // Clear container
    container.innerHTML = '';

    // Create card elements
    cards.forEach((card, index) => {
      const isPlayable = playableCards.includes(index);
      const isSelected = selectedCard === index;
      
      const cardElement = this.createCardElement(card, {
        playable: isPlayable,
        selected: isSelected,
        size,
        clickable
      });
      
      container.appendChild(cardElement);
    });
  }

  /**
   * Render other player cards (face down)
   * @param {number} cardCount - Number of cards
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Rendering options
   */
  renderOtherPlayerCards(cardCount, container, options = {}) {
    const { size = 'small' } = options;

    // Clear container
    container.innerHTML = '';

    // Create face down cards
    for (let i = 0; i < cardCount; i++) {
      const cardElement = this.createCardElement({}, {
        faceDown: true,
        size,
        clickable: false
      });
      
      container.appendChild(cardElement);
    }
  }

  /**
   * Render top card
   * @param {Object} card - Card object
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Rendering options
   */
  renderTopCard(card, container, options = {}) {
    const { size = 'large' } = options;

    // Clear container
    container.innerHTML = '';

    if (card) {
      const cardElement = this.createCardElement(card, {
        size,
        clickable: false,
        showValue: true
      });
      
      container.appendChild(cardElement);
    } else {
      // Show empty state
      container.innerHTML = '<div class="empty-card">No card</div>';
    }
  }

  /**
   * Render draw pile
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Rendering options
   */
  renderDrawPile(container, options = {}) {
    const { size = 'large', clickable = true } = options;

    // Clear container
    container.innerHTML = '';

    const cardElement = this.createCardElement({}, {
      faceDown: true,
      size,
      clickable
    });

    if (clickable) {
      cardElement.addEventListener('click', () => {
        this.handleDrawCard();
      });
    }

    container.appendChild(cardElement);
  }

  /**
   * Handle draw card
   */
  handleDrawCard() {
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.drawCard(window.gameState.roomId);
    }
    
    Utils.playSound('card-draw');
    Utils.vibrate(50);
  }

  /**
   * Animate card dealing
   * @param {HTMLElement} cardElement - Card element
   * @param {number} delay - Animation delay
   */
  animateCardDeal(cardElement, delay = 0) {
    setTimeout(() => {
      cardElement.classList.add('animate-card-deal');
      
      setTimeout(() => {
        cardElement.classList.remove('animate-card-deal');
      }, 600);
    }, delay);
  }

  /**
   * Animate card draw
   * @param {HTMLElement} cardElement - Card element
   */
  animateCardDraw(cardElement) {
    cardElement.classList.add('animate-card-draw');
    
    setTimeout(() => {
      cardElement.classList.remove('animate-card-draw');
    }, 500);
  }

  /**
   * Animate card shuffle
   * @param {HTMLElement} cardElement - Card element
   */
  animateCardShuffle(cardElement) {
    cardElement.classList.add('animate-card-shuffle');
    
    setTimeout(() => {
      cardElement.classList.remove('animate-card-shuffle');
    }, 300);
  }

  /**
   * Update card playability
   * @param {HTMLElement} cardElement - Card element
   * @param {boolean} playable - Whether card is playable
   */
  updateCardPlayability(cardElement, playable) {
    if (playable) {
      cardElement.classList.add('playable');
    } else {
      cardElement.classList.remove('playable');
    }
  }

  /**
   * Update card selection
   * @param {HTMLElement} cardElement - Card element
   * @param {boolean} selected - Whether card is selected
   */
  updateCardSelection(cardElement, selected) {
    if (selected) {
      cardElement.classList.add('selected');
    } else {
      cardElement.classList.remove('selected');
    }
  }

  /**
   * Get card element by ID
   * @param {string} cardId - Card ID
   * @returns {HTMLElement|null} Card element
   */
  getCardElement(cardId) {
    return document.querySelector(`[data-card-id="${cardId}"]`);
  }

  /**
   * Get all card elements
   * @returns {NodeList} All card elements
   */
  getAllCardElements() {
    return document.querySelectorAll('.uno-card');
  }

  /**
   * Clear all card selections
   */
  clearAllSelections() {
    const cardElements = this.getAllCardElements();
    cardElements.forEach(card => {
      card.classList.remove('selected');
    });
  }

  /**
   * Update card size based on container
   * @param {HTMLElement} container - Container element
   * @param {string} size - Card size
   */
  updateCardSize(container, size) {
    const cardElements = container.querySelectorAll('.uno-card');
    cardElements.forEach(card => {
      card.classList.remove('small', 'normal', 'large');
      card.classList.add(size);
    });
  }

  /**
   * Create card back element
   * @param {Object} options - Options
   * @returns {HTMLElement} Card back element
   */
  createCardBack(options = {}) {
    const { size = 'normal', clickable = false } = options;
    
    const cardElement = document.createElement('div');
    cardElement.className = 'card-back';
    
    if (size === 'small') {
      cardElement.style.width = '20px';
      cardElement.style.height = '28px';
    } else if (size === 'large') {
      cardElement.style.width = '80px';
      cardElement.style.height = '112px';
    } else {
      cardElement.style.width = '60px';
      cardElement.style.height = '84px';
    }
    
    cardElement.innerHTML = '<i class="fas fa-layer-group"></i>';
    
    if (clickable) {
      cardElement.style.cursor = 'pointer';
      cardElement.addEventListener('click', () => {
        this.handleDrawCard();
      });
    }
    
    return cardElement;
  }

  /**
   * Destroy card renderer
   */
  destroy() {
    // Remove all event listeners
    const cardElements = this.getAllCardElements();
    cardElements.forEach(card => {
      card.replaceWith(card.cloneNode(true));
    });
  }
}

// Create global instance
window.cardRenderer = new CardRenderer();
