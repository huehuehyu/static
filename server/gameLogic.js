const { v4: uuidv4 } = require('uuid');

class GameLogic {
  initializeGame(players, scoreLimit) {
    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);
    
    // Deal 7 cards to each player
    players.forEach(player => {
      player.cards = shuffledDeck.splice(0, 7);
      player.score = this.calculateHandValue(player.cards, '');
      player.hasShown = false;
      player.canShow = false;
    });

    // Set up discard pile with one card
    const discardPile = [shuffledDeck.pop()];
    
    // Choose random joker value (not JOKER itself)
    const jokerValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const jokerValue = jokerValues[Math.floor(Math.random() * jokerValues.length)];

    // Mark joker cards in player hands
    players.forEach(player => {
      player.cards.forEach(card => {
        card.isJoker = card.value === 'JOKER' || card.value === jokerValue;
      });
      player.score = this.calculateHandValue(player.cards, jokerValue);
    });

    return {
      id: uuidv4(),
      players,
      currentPlayerIndex: 0,
      deck: shuffledDeck,
      discardPile,
      jokerValue,
      isFirstRound: true,
      gameStarted: true,
      gameEnded: false,
      winner: null,
      scoreLimit,
      roundNumber: 1
    };
  }

  processAction(gameState, action) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.id !== action.playerId) {
      return { error: 'Not your turn' };
    }

    switch (action.type) {
      case 'PICK_DECK':
        return this.pickFromDeck(gameState, action.playerId);
      
      case 'PICK_DISCARD':
        return this.pickFromDiscard(gameState, action.playerId);
      
      case 'DROP_CARD':
        return this.dropCard(gameState, action.playerId, action.cardId);
      
      case 'SHOW_CARDS':
        return this.showCards(gameState, action.playerId);
      
      case 'PASS_TURN':
        return this.passTurn(gameState);
      
      default:
        return { error: 'Invalid action' };
    }
  }

  pickFromDeck(gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!player || gameState.deck.length === 0) {
      return { error: 'Cannot pick from deck' };
    }

    const card = gameState.deck.pop();
    card.isJoker = card.value === 'JOKER' || card.value === gameState.jokerValue;
    player.cards.push(card);

    return { success: true };
  }

  pickFromDiscard(gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!player || gameState.discardPile.length === 0) {
      return { error: 'Cannot pick from discard pile' };
    }

    const card = gameState.discardPile.pop();
    card.isJoker = card.value === 'JOKER' || card.value === gameState.jokerValue;
    player.cards.push(card);

    return { success: true };
  }

  dropCard(gameState, playerId, cardId) {
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!player) {
      return { error: 'Player not found' };
    }

    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { error: 'Card not found' };
    }

    const droppedCard = player.cards.splice(cardIndex, 1)[0];
    gameState.discardPile.push(droppedCard);
    
    player.score = this.calculateHandValue(player.cards, gameState.jokerValue);
    player.canShow = true;

    // Move to next turn
    this.nextTurn(gameState);

    return { success: true };
  }

  showCards(gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!player) {
      return { error: 'Player not found' };
    }

    if (gameState.isFirstRound && !player.canShow) {
      return { error: 'Cannot show in first round without playing' };
    }

    player.hasShown = true;
    player.score = this.calculateHandValue(player.cards, gameState.jokerValue);

    // Check if round ends (all players shown or only one left)
    const activePlayers = gameState.players.filter(p => !p.hasShown);
    if (activePlayers.length <= 1) {
      return this.endRound(gameState);
    }

    // Move to next turn
    this.nextTurn(gameState);

    return { success: true };
  }

  passTurn(gameState) {
    this.nextTurn(gameState);
    return { success: true };
  }

  skipTurn(gameState) {
    this.nextTurn(gameState);
  }

  autoShowCards(gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (player && !player.hasShown) {
      player.hasShown = true;
      player.score = this.calculateHandValue(player.cards, gameState.jokerValue);
      
      // Check if round ends
      const activePlayers = gameState.players.filter(p => !p.hasShown);
      if (activePlayers.length <= 1) {
        this.endRound(gameState);
      } else {
        this.nextTurn(gameState);
      }
    }
  }

  nextTurn(gameState) {
    do {
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    } while (gameState.players[gameState.currentPlayerIndex].hasShown);
  }

  endRound(gameState) {
    // Calculate scores
    gameState.players.forEach(player => {
      if (!player.hasShown) {
        player.hasShown = true;
        player.score = this.calculateHandValue(player.cards, gameState.jokerValue);
      }
      player.totalScore += player.score;
    });

    // Check if game ends (someone crossed score limit)
    const maxScore = Math.max(...gameState.players.map(p => p.totalScore));
    if (maxScore >= gameState.scoreLimit) {
      gameState.gameEnded = true;
      const winner = gameState.players.reduce((min, player) => 
        player.totalScore < min.totalScore ? player : min
      );
      gameState.winner = winner.name;
      return { success: true };
    }

    // Start next round
    gameState.roundNumber++;
    gameState.isFirstRound = false;
    
    // Reset for next round
    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);
    
    gameState.players.forEach(player => {
      player.cards = shuffledDeck.splice(0, 7);
      player.hasShown = false;
      player.canShow = false;
      player.cards.forEach(card => {
        card.isJoker = card.value === 'JOKER' || card.value === gameState.jokerValue;
      });
      player.score = this.calculateHandValue(player.cards, gameState.jokerValue);
    });

    gameState.deck = shuffledDeck;
    gameState.discardPile = [shuffledDeck.pop()];
    gameState.currentPlayerIndex = 0;

    return { success: true };
  }

  createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];

    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({
          id: `${suit}-${value}`,
          suit,
          value,
          numericValue: this.getCardValue(value),
          isJoker: false
        });
      });
    });

    // Add jokers
    deck.push({
      id: 'joker-1',
      suit: 'hearts',
      value: 'JOKER',
      numericValue: 0,
      isJoker: true
    });
    
    deck.push({
      id: 'joker-2',
      suit: 'spades',
      value: 'JOKER',
      numericValue: 0,
      isJoker: true
    });

    return deck;
  }

  shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getCardValue(value) {
    if (value === 'A') return 1;
    if (['J', 'Q', 'K'].includes(value)) return 10;
    if (value === 'JOKER') return 0;
    return parseInt(value);
  }

  calculateHandValue(cards, jokerValue) {
    return cards.reduce((total, card) => {
      if (card.value === 'JOKER' || card.value === jokerValue) {
        return total; // Jokers count as 0
      }
      return total + card.numericValue;
    }, 0);
  }
}

module.exports = GameLogic;