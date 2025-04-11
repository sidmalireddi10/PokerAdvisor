import { useState, useEffect, useRef } from "react";

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function getCardImageFilename(value, suit) {
  const valueMap = {
    A: "ace",
    K: "king",
    Q: "queen",
    J: "jack",
    "10": "10",
    "9": "9",
    "8": "8",
    "7": "7",
    "6": "6",
    "5": "5",
    "4": "4",
    "3": "3",
    "2": "2",
  };

  const suitMap = {
    "♠": "spades",
    "♥": "hearts",
    "♦": "diamonds",
    "♣": "clubs",
  };

  const val = valueMap[value];
  const s = suitMap[suit];
  return val && s ? `/cards/${val}_of_${s}.png` : null;
}

function getRecommendation(hand, board) {
  if (hand.length !== 2 || !hand[0].value || !hand[1].value) return "Please enter a valid hand";

  const ranks = hand.map(card => card.value);
  const rankStrength = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

  const isPair = ranks[0] === ranks[1];
  const sorted = [...ranks].sort((a, b) => rankStrength.indexOf(a) - rankStrength.indexOf(b));

  if (isPair) {
    const pairRank = ranks[0];
    if (pairRank === "A") return "Raise";
    if (pairRank === "K") return board.some(c => c.value === "A") ? "Check or Call" : "Raise";
    if (["Q", "J", "10"].includes(pairRank)) return "Raise";
    if (["9", "8", "7"].includes(pairRank)) return "Raise or Call";
    return "Call or Fold depending on position";
  } else {
    if (sorted[0] === "A" && sorted[1] === "K") return "Raise";
    if (sorted[0] === "A" && sorted[1] === "Q") return "Raise or Call";
    if (sorted[0] === "K" && sorted[1] === "Q") return "Raise or Call";
    if (sorted[0] === "Q" && sorted[1] === "J") return "Call";
    if (["10", "9", "8", "7", "6"].includes(sorted[0]) && ["9", "8", "7", "6", "5"].includes(sorted[1])) return "Call or Fold depending on suited/connectors";
  }

  return "Check or Fold";
}

function estimateEV(hand, board) {
  if (!hand[0].value || !hand[1].value) return 0;
  const strongHands = ["A", "K", "Q", "J", "10"];

  let ev = 0;
  const ranks = hand.map(c => c.value);
  const isPair = ranks[0] === ranks[1];
  const highCardBonus = strongHands.includes(ranks[0]) + strongHands.includes(ranks[1]);
  const suited = hand[0].suit === hand[1].suit;

  if (isPair) {
    ev += 3;
    if (["A", "K"].includes(ranks[0])) ev += 2;
    else if (["Q", "J", "10"].includes(ranks[0])) ev += 1;
  } else {
    ev += highCardBonus;
    if (suited) ev += 0.5;
  }

  const aceOnBoard = board.some(c => c.value === "A");
  if (ranks.includes("K") && ranks.includes("K") && aceOnBoard) ev -= 1.5;

  return Math.max(0, ev.toFixed(2));
}

function calculatePotOdds(callAmount, potSize) {
  if (callAmount <= 0 || potSize <= 0) return 0;
  const totalPot = callAmount + potSize;
  return ((callAmount / totalPot) * 100).toFixed(2);
}

function CardSelector({ card, onChange, allCards }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClick = () => {
    setShowPicker(!showPicker);
  };

  const isDuplicate = (value, suit) => {
    return allCards.some(
      (c) => c.value === value && c.suit === suit && (c !== card)
    );
  };

  const resetCard = () => {
    onChange({ suit: "", value: "" });
  };

  const selectSuit = (suit) => {
    if (!isDuplicate(card.value, suit)) {
      onChange({ ...card, suit });
    }
  };

  const selectValue = (value) => {
    if (!isDuplicate(value, card.suit)) {
      onChange({ ...card, value });
    }
  };

  const cardImage = getCardImageFilename(card.value, card.suit);

  return (
    <div className="card-selector" style={{ position: "relative" }}>
      <div onClick={handleClick}>
        {cardImage ? (
          <img
            src={cardImage}
            alt={`${card.value} of ${card.suit}`}
            style={{
              width: "70px",
              height: "100px",
              borderRadius: "8px",
              border: "1px solid #444",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          />
        ) : (
          <img
            src="/cards/card_back.jpeg"
            alt="Card Back"
            style={{
              width: "70px",
              height: "100px",
              borderRadius: "8px",
              border: "1px solid #444",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              cursor: "pointer",
            }}
          />
        )}
      </div>

      {showPicker && (
        <div
          className="picker-popup"
          ref={pickerRef}
          style={{ minWidth: "300px" }}
        >
          <div className="picker-section">
            <strong>Suit</strong>
            <div className="picker-row">
              {suits.map((s) => (
                <button
                  key={s}
                  onClick={() => selectSuit(s)}
                  className={card.suit === s ? "selected" : ""}
                  style={{
                    color: s === "♥" || s === "♦" ? "red" : "black",
                    opacity: isDuplicate(card.value, s) ? 0.4 : 1,
                    pointerEvents: isDuplicate(card.value, s) ? "none" : "auto",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="picker-section">
            <strong>Value</strong>
            <div className="picker-row">
              {values.map((v) => (
                <button
                  key={v}
                  onClick={() => selectValue(v)}
                  className={card.value === v ? "selected" : ""}
                  style={{
                    opacity: isDuplicate(v, card.suit) ? 0.4 : 1,
                    pointerEvents: isDuplicate(v, card.suit) ? "none" : "auto",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="picker-section">
            <button onClick={resetCard} style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Reset Card</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PokerAdvisor() {
  const defaultHand = [
    { suit: "", value: "" },
    { suit: "", value: "" },
  ];
  const defaultBoard = [
    { suit: "", value: "" },
    { suit: "", value: "" },
    { suit: "", value: "" },
    { suit: "", value: "" },
    { suit: "", value: "" },
  ];

  const [hand, setHand] = useState([...defaultHand]);
  const [board, setBoard] = useState([...defaultBoard]);
  const [potSize, setPotSize] = useState("100");
  const [callAmount, setCallAmount] = useState("25");

  const handleHandChange = (index, newCard) => {
    const newHand = [...hand];
    newHand[index] = newCard;
    setHand(newHand);
  };

  const handleBoardChange = (index, newCard) => {
    const newBoard = [...board];
    newBoard[index] = newCard;
    setBoard(newBoard);
  };

  const resetAll = () => {
    setHand([...defaultHand]);
    setBoard([...defaultBoard]);
    setPotSize("100");
    setCallAmount("25");
  };

  const recommendation = getRecommendation(hand, board);
  const ev = estimateEV(hand, board);
  const potOdds = calculatePotOdds(Number(callAmount), Number(potSize));

  const allCards = [...hand, ...board];

  return (
    <div className="container">
      <h1>Poker EV Advisor</h1>

      <button onClick={resetAll} style={{ marginBottom: "1rem" }}>
        Reset All
      </button>

      <section>
        <h2>Your Hand</h2>
        <div className="cards">
          {hand.map((card, index) => (
            <CardSelector
              key={index}
              card={card}
              allCards={allCards}
              onChange={(newCard) => handleHandChange(index, newCard)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Flop / Turn / River</h2>
        <div className="cards">
          {board.map((card, index) => (
            <CardSelector
              key={index}
              card={card}
              allCards={allCards}
              onChange={(newCard) => handleBoardChange(index, newCard)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Pot Settings</h2>
        <label>
          Pot Size: $<input type="text" inputMode="decimal" value={potSize} onChange={(e) => setPotSize(e.target.value)} />
        </label>
        <br />
        <label>
          Call Amount: $<input type="text" inputMode="decimal" value={callAmount} onChange={(e) => setCallAmount(e.target.value)} />
        </label>
      </section>

      <section className="results">
        <h3>Recommendation: {recommendation}</h3>
        <h3>Expected Value (EV): {ev} chips</h3>
        <h3>Pot Odds: {potOdds}%</h3>
      </section>
    </div>
  );
}
