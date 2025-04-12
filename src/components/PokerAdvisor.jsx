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
  return val && s ? `${import.meta.env.BASE_URL}cards/${val}_of_${s}.png` : null;
}

async function fetchAIAnalysis(hand, board, potSize, callAmount, position, style) {
  try {
    const res = await fetch("/.netlify/functions/ai-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ hand, board, potSize, callAmount, position, style })
    });

    if (!res.ok) {
      const text = await res.text(); // fallback to reading raw error text
      throw new Error(`AI Server Error (${res.status}): ${text}`);
    }

    const result = await res.json();
    return result.result || "AI did not return a message.";
  } catch (err) {
    console.error("AI Analysis error:", err);
    return "AI analysis failed. Please try again later.";
  }
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
  const [dealt, setDealt] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setDealt(true), 100); // slight delay after load
  return () => clearTimeout(timer);
}, []);


  return (
    <div className="card-selector" style={{ position: "relative" }}>
      <div onClick={handleClick}>
        {cardImage ? (
          <img
            src={cardImage}
            alt={`${card.value} of ${card.suit}`}
            className="poker-card"
          />
        ) : (
          <img
            src="/cards/card_back.jpeg"
            alt="Card Back"
            className="poker-card"
            style={{
              cursor: "pointer"
            }}
          />
        )}
      </div>

      {showPicker && (
        <div className="picker-popup" ref={pickerRef} style={{ minWidth: "300px" }}>
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
            <button onClick={resetCard} style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              Reset Card
            </button>
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
    const [potSize, setPotSize] = useState("Insert Value");
    const [callAmount, setCallAmount] = useState("Insert Value");
    const [aiAnalysis, setAIAnalysis] = useState("Waiting for input...");
    const [loading, setLoading] = useState(false);
  
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
      setPotSize("Insert Value");
      setCallAmount("Insert Value");
      setAIAnalysis("Waiting for input...");
    };
  
    const handleAIAnalysis = async () => {
      setLoading(true);
      const result = await fetchAIAnalysis(hand, board, potSize, callAmount, position, style);
      setAIAnalysis(result);
      setLoading(false);
    };
  
    const allCards = [...hand, ...board];
    const [showHelp, setShowHelp] = useState(null);
    const [showHandsPopup, setShowHandsPopup] = useState(false);
    const [position, setPosition] = useState("Middle"); // Default
    const [style, setStyle] = useState("Balanced");
    useEffect(() => {
      document.body.style.overflow = showHandsPopup || showHelp ? "hidden" : "auto";
    }, [showHandsPopup, showHelp]);
    const [theme, setTheme] = useState("felt");

useEffect(() => {
  document.body.className = ""; // clear existing theme
  document.body.classList.add(`theme-${theme}`);
}, [theme]);

  
    return (
      <div className="page-wrapper">
        <div className="layout">
        <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
  <select
    className="input-field"
    value={theme}
    onChange={(e) => setTheme(e.target.value)}
    style={{ width: "105%" }}
  >
    <option value="felt">Green Felt</option>
    <option value="red">Red Velvet</option>
    <option value="dark">Dark Mode</option>
    <option value="light">Light Mode</option>
  </select>
</div>

          <div className="main-panel container">
          <div className="section-wrapper">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", marginBottom: "1.25rem" }}>
              <img
                src={`${import.meta.env.BASE_URL}pokeradvisorlogo1.png`}
                alt="Poker Advisor Logo"
                style={{ maxHeight: "70px", height: "auto", width: "auto" }}
              />
              <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Poker Advisor</h1>
            </div>
            
            <button onClick={resetAll} className="primary-button" style={{ marginBottom: "1rem" }}>
              Reset All
            </button>
            
            <button className="help-icon" onClick={() => setShowHelp("hand")}>❓</button>
            <section>
              <h1>Your Hand</h1>
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
              <h1>Flop / Turn / River</h1>
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

            
            {showHelp === "hand" && (
    <div className="modal" onClick={() => setShowHelp(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-button" onClick={() => setShowHelp(null)}>X</button>
        <h3>How To Work Poker Advisor</h3>
        <p>
        1. First, select what your order at the table is from the dropdown and your preferred playstyle.
        <br></br><br></br>
        2. Click each card listed under 'Your Hand'. For each, choose the suit and the card value according to the hand you have received in your game. This is your pre-flop hand. Then, set the initial pot size and call amount, and analyze your hand.
        <br></br><br></br>
        3. Then, if you did not fold do the same for three more cards under 'Flop/Turn/River'. This is considered the flop. Adjust the pot size and call amount. Now, analyze again.
        <br></br><br></br>
        4. Next is the turn. If not folded already, set the suit and value for the fourth card. Adjust the pot size and call amount. Now, analyze again.
        <br></br><br></br>
        5. Finally, do the same for the river. Set the suit and value for the last card. Adjust the pot size and call amount. Now, analyze again.
        <br></br><br></br>
        *Once the hand is over or you have folded, press 'Reset All' at the top of the screen.*
        </p>
      </div>
    </div>
  )}

            </div>

  <section>
    <h1>Pot Settings</h1>
    <label>
      Pot Size: $&nbsp;
      <input className="insert-field" type="text" inputMode="decimal" value={potSize} onChange={(e) => setPotSize(e.target.value)} onFocus={() => {if (potSize === "Insert Value") setPotSize("");}} />
    </label>
    <br /><br />
    <label>
      Call Amount: $&nbsp;
      <input className="insert-field" type="text" inputMode="decimal" value={callAmount} onChange={(e) => setCallAmount(e.target.value)} onFocus={() => {if (callAmount === "Insert Value") setCallAmount("");}} />
    </label>
  </section>

{/* Floating Poker Hands Button */}
<button className="floating-hands-btn" onClick={() => setShowHandsPopup(true)}>🂡 Poker Hands</button>

{/* Winning Hands Popup */}
{showHandsPopup && (
  <div className="hands-popup" onClick={() => setShowHandsPopup(false)}>
    <div className="hands-popup-content" onClick={(e) => e.stopPropagation()}>
      <button className="exit-button" onClick={() => setShowHandsPopup(false)}>×</button>
      <h1>Winning Poker Hands</h1>
      <div className="hand-group">
        <h4>Royal Flush</h4>
        <br></br>
        <div className="card-row">
          {["ace", "king", "queen", "jack", "10"].map((val) => (
            <img key={val} src={`/cards/${val}_of_spades.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>Straight Flush</h4>
        <br></br>
        <div className="card-row">
          {["9", "8", "7", "6", "5"].map((val) => (
            <img key={val} src={`/cards/${val}_of_diamonds.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>Four of a Kind</h4>
        <br></br>
        <div className="card-row">
          {["queen", "queen", "queen", "queen", "5"].map((val, i) => (
            <img key={i} src={`/cards/${val}_of_${i < 4 ? ["spades", "hearts", "clubs", "diamonds"][i] : "spades"}.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>Full House</h4>
        <br></br>
        <div className="card-row">
          {["10", "10", "10", "king", "king"].map((val, i) => (
            <img key={i} src={`/cards/${val}_of_${["spades", "hearts", "diamonds", "clubs", "diamonds"][i]}.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>Flush</h4>
        <br></br>
        <div className="card-row">
          {["ace", "jack", "9", "6", "4"].map((val) => (
            <img key={val} src={`/cards/${val}_of_clubs.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>Straight</h4>
        <br></br>
        <div className="card-row">
          {["8", "7", "6", "5", "4"].map((val, i) => (
            <img key={val} src={`/cards/${val}_of_${["spades", "diamonds", "clubs", "spades", "hearts"][i]}.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>Three of a Kind</h4>
        <br></br>
        <div className="card-row">
          {["5", "5", "5", "king", "2"].map((val, i) => (
            <img key={i} src={`/cards/${val}_of_${["diamonds", "spades", "hearts", "clubs", "clubs"][i]}.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>Two Pair</h4>
        <br></br>
        <div className="card-row">
          {["9", "9", "4", "4", "jack"].map((val, i) => (
            <img key={i} src={`/cards/${val}_of_${["clubs", "diamonds", "spades", "hearts", "diamonds"][i]}.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>One Pair</h4>
        <br></br>
        <div className="card-row">
          {["ace", "ace", "8", "5", "2"].map((val, i) => (
            <img key={i} src={`/cards/${val}_of_${["spades", "diamonds", "clubs", "hearts", "spades"][i]}.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
      <br></br>
      <div className="hand-group">
        <h4>High Card</h4>
        <br></br>
        <div className="card-row">
          {["ace", "10", "8", "4", "2"].map((val, i) => (
            <img key={i} src={`/cards/${val}_of_${["diamonds", "clubs", "spades", "hearts", "clubs"][i]}.png`} alt={val} className="inline-card" />
          ))}
        </div>
      </div>
    </div>
  </div>
)}


  </div>
<div className="right-panel">
  <div className="player-options-panel container" style={{ background: "#1a1a1a", border: "1px solid #444", width: "400px"}}>
    <h2>Player Info</h2>
    <section>
      <h3>Player Position</h3>
      <br></br>
      <select
        className="input-field"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        style={{ width: "100%" }}
      >
        <option value="Early">Early</option>
        <option value="Middle">Middle</option>
        <option value="Late">Late</option>
        <option value="Blinds">Blinds</option>
      </select>
    </section>

    <br />

    <section>
      <h3>Play Style</h3>
      <br></br>
      <select
        className="input-field"
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        style={{ width: "100%" }}
      >
        <option value="Tight Conservative">Tight Conservative</option>
        <option value="Loose Aggressive">Loose Aggressive</option>
        <option value="Balanced">Balanced</option>
      </select>
    </section>
  </div>

  
          <div className="ai-panel container" style={{ background: "#1a1a1a", border: "1px solid #444" }}>
          <div className="section-wrapper">
          <button className="help-icon" onClick={() => setShowHelp("ai")}>❓</button>
          <br></br>
            <h2>AI Insights</h2>
            <button onClick={handleAIAnalysis} className="primary-button" style={{ marginBottom: "1rem", width: "100%" }}>
              {loading ? "Analyzing..." : "Run AI Analysis"}
            </button>
  
            <div className="results" style={{ width: "100%" }}>
              <h3>AI Analysis:</h3>
              <p>{aiAnalysis}</p>

              {showHelp === "ai" && (
    <div className="modal" onClick={() => setShowHelp(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-button" onClick={() => setShowHelp(null)}>X</button>
        <h3>Interpreting The Analysis</h3>
        <p>The AI-generated recommendation is designed to provide a quick summary of your current poker situation and suggest a strategic course of action based on standard poker logic. While it takes into account your hand, the board, and pot dynamics, it should be used as a helpful guide—not a strict rule. Poker is a game of both math and instinct, and we encourage you to trust your own judgment when deciding whether to fold, call, raise, or bluff. Please note that this analysis is for informational purposes only; we are not responsible for any betting decisions or game outcomes that result from using this tool.</p>
      </div>
    </div>
    
  )}
  
            </div>
            
          </div>
          <footer className="footer">
  © {new Date().getFullYear()} Siddharth Malireddi. All rights reserved.
</footer>
        </div>
        
      </div>
      
      </div>
      </div>
    );
  }
  