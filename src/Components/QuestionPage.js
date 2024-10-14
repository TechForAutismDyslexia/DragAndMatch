import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile, isTablet } from "react-device-detect";
// eslint-disable-next-line
import { Tooltip } from "bootstrap";
import Confetti from "react-confetti";
import update from "immutability-helper";
import data from "./data.json";
import CorrectAudio from "../assets/audio/Correct.mp3";
import OopsTryAgainAudio from "../assets/audio/OopsTryAgain.mp3";
import PleaseAddTheImagesAudio from "../assets/audio/PleaseAddTheImages.mp3";
import HowToPlayAudio from "../assets/audio/HowToPlay.mp3";
import gobackimage from "../assets/images/GoBack.png";
import resetimage from "../assets/images/Reset.png";
import playaudioimage from "../assets/images/playaudio.svg";

const ItemType = "IMAGE";
const AnswerType = "ANSWER_IMAGE";

const DraggableImage = ({ src, index }) => {
  // eslint-disable-next-line
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index, src },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <img
      ref={drag}
      src={src}
      className={`img-thumbnail  dragImg`}
      width="100"
      height="100"
      alt={`option-${index}`}
      style={{ margin: "5px" }}
    />
  );
};

const DraggableAnswerImage = ({ src, index, moveImage }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: AnswerType,
    hover: (item) => {
      if (item.index !== index) {
        moveImage(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: AnswerType,
    item: { index },

    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <img
      ref={ref}
      src={src}
      className={`img-thumbnail m-1 ${
        isDragging ? "opacity-50" : ""
      } answerImg`}
      width="100"
      height="100"
      alt={`answer-${index}`}
    />
  );
};

const getHoverIndex = (monitor, ref, answerImages) => {
  const hoverBoundingRect = ref.current.getBoundingClientRect();
  const hoverClientX = monitor.getClientOffset().x - hoverBoundingRect.left;

  let newIndex = 0;
  let sumWidth = 0;

  for (let i = 0; i < answerImages.length; i++) {
    const imgWidth = 100; // width of the image (you may adjust if needed)
    sumWidth += imgWidth + 10; // width + margin
    if (hoverClientX < sumWidth) {
      newIndex = i;
      break;
    } else {
      newIndex = i + 1;
    }
  }
  return newIndex;
};

const DroppableBox = ({
  answerImages,
  setAnswerImages,
  maxItems,
  borderClass,
}) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      const hoverIndex = getHoverIndex(monitor, ref, answerImages);
      item.hoverIndex = hoverIndex;
    },
    drop: (item) => {
      if (answerImages.length >= maxItems) {
        return;
      }
      const hoverIndex =
        item.hoverIndex !== undefined ? item.hoverIndex : answerImages.length;
      const newAnswerImages = update(answerImages, {
        $splice: [[hoverIndex, 0, item.src]],
      });
      setAnswerImages(newAnswerImages);
    },
  });

  const moveImage = (fromIndex, toIndex) => {
    const draggedImage = answerImages[fromIndex];
    const newAnswerImages = update(answerImages, {
      $splice: [
        [fromIndex, 1],
        [toIndex, 0, draggedImage],
      ],
    });
    setAnswerImages(newAnswerImages);
  };

  return (
    <div
      ref={drop}
      className={`answerbox p-3 d-flex flex-row flex-wrap align-items-center justify-content-center ${borderClass}`}
      style={{ minHeight: "180px", width: "100%" }}
    >
      <div
        ref={ref}
        className="d-flex flex-row flex-wrap align-items-center justify-content-center"
      >
        {answerImages.map((src, index) => (
          <DraggableAnswerImage
            key={index}
            src={src}
            index={index}
            moveImage={moveImage}
          />
        ))}
      </div>
    </div>
  );
};

const QuestionPage = () => {
  const images = useRef({});
  const [currentPage, setCurrentPage] = useState(0);
  const [answerImages, setAnswerImages] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tries, setTries] = useState(0);
  const [borderClass, setBorderClass] = useState("");
  const [warning, setWarning] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef();

  const sendGameData = async () => {
    try {
      const gameId = localStorage.getItem("gameId");
      const childId = localStorage.getItem("childId");
      const logintoken = localStorage.getItem("logintoken");
      const timer = localStorage.getItem("timer");
      const tri = localStorage.getItem("tries");

      await axios.put(
        `https://jwlgamesbackend.vercel.app/api/caretaker/${gameId}/${childId}`,
        
        {
          tries: tri,
          timer: timer,
          status: true,
        },
        {
          headers: {
            Authorization: logintoken,
          },
        }
      );
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    ["a1", "a2", "a3", "a4", "boat", "jar"].forEach(
      async (img) =>
        (images.current[img] = (
          await import(`../assets/images/${img}.png`)
        ).default)
    );
  }, []);

  const handleAudioClick = (audioFile) => {
    const audio = new Audio(audioFile);
    audio.play();
  };

  const questionData = data[currentPage];
  // eslint-disable-next-line
  const gameInstructions =
    "Drag and Drop the images from the options into the answer box in the same order as given in the question (You can also reorder the images in the answer box)";
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    // eslint-disable-next-line
    const tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl)
    );
  }, []);

  if (!questionData) {
    return <div>Loading...</div>;
  }

  const handleStartGame = () => {
    setGameStarted(true);
    timerRef.current = Date.now();
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const questionImages = data[currentPage].question.map((img) => {
      return images.current[img];
    });
    const isCorrect =
      JSON.stringify(answerImages) === JSON.stringify(questionImages);
    if (isCorrect) {
      setTries(tries + 1);
      setShowConfetti(true);
      setWarning("Correct!!");
      const CorrectAud = new Audio(CorrectAudio);
      CorrectAud.play();
      setBorderClass("blink-green");

      if (data[currentPage + 1]) {
        setTimeout(() => {
          setShowConfetti(false);
          setBorderClass("");
          setSubmitted(false);
          setCurrentPage(currentPage + 1);
          setAnswerImages([]);
        }, 4000);
      } else {
        setTimeout(() => {
          clearInterval(timerRef.current);
          setShowConfetti(false);
          setBorderClass("");
          setGameOver(true);
          timerRef.current = Date.now() - timerRef.current;
          localStorage.setItem("tries", tries);
          localStorage.setItem("timer", Math.floor(timerRef.current/1000));
          sendGameData();
        }, 4000);
      }
    } else {
      setBorderClass("blink-red");
      if (JSON.stringify(answerImages).length < 3) {
        const PleaseAddTheImagesAud = new Audio(PleaseAddTheImagesAudio);
        PleaseAddTheImagesAud.play();
        setWarning("Please add the images.");
      } else if (!isCorrect) {
        setTries(tries + 1);
        const OopsTryAgainAud = new Audio(OopsTryAgainAudio);
        OopsTryAgainAud.play();
        setWarning("Oops! Try Again :)");
      }
      setTimeout(() => {
        setBorderClass("");
        setSubmitted(false);
      }, 2500);
      setAnswerImages([]);
    }
  };

  const resetGame = () => {
    setCurrentPage(0);
    setAnswerImages([]);
    setShowConfetti(false);
    setTries(0);
    setBorderClass("");
    setWarning("");
    setSubmitted(false);
    setGameOver(false);
    setGameStarted(false);
  };

  const handleBackClick = ()=>{
    window.location.href = window.location.origin + '/adminportal/games'
  }

  function formatTime(milliseconds) {
    let totalSeconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    return `${minutes} minute${minutes !== 1 ? "s" : ""} ${seconds} second${
      seconds !== 1 ? "s" : ""
    }`;
  }

  return (
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
      <div className="d-flex align-items-start m-4">
        <div className="left-panel d-flex flex-column align-items-center ">
          <div className="left-button">
            <div className="position-relative">
              <img
                src={playaudioimage}
                alt="Play audio"
                width="40"
                height="35"
                className="border border-dark border-3 rounded-4 hover-effect"
                style={{ cursor: "pointer" }}
                onClick={() => handleAudioClick(HowToPlayAudio)}
                data-bs-toggle="tooltip"
                data-bs-placement="right"
                data-bs-custom-class="custom-tooltip"
                data-bs-title="Drag and Drop the images from the options into the answer box in the same order as given in the question (You can also reorder the images in the answer box)"
              />
            </div>

            <p>Game Instructions</p>
          </div>
          <div className="left-button">
            <img
              className="border border-dark border-3 rounded-4 hover-effect"
              src={resetimage}
              alt="Reset Game"
              width="40"
              height="35"
              onClick={resetGame}
            />
            <p>Reset Game</p>
          </div>
          <div className="left-button">
            <img
              className="border border-dark border-3 rounded-4 hover-effect"
              src={gobackimage}
              alt="Go Back To Home"
              width="40"
              height="35"
              onClick={handleBackClick}
            />

            <p>Go Back</p>
          </div>
        </div>

        <div className="container main">
          {!gameStarted ? (
            <div className="start-game">
              <h1 className="mt-3 ">Drag and Match</h1>
              <button
                onClick={handleStartGame}
                className="custombutton mb-3 mt-3"
              >
                Start Game
              </button>
            </div>
          ) : gameOver ? (
            <div className="game-over">
              <h2 className="mt-2 mb-2">Game Over!</h2>
              <h3 className="mt-3 mb-2">
                Time taken: {formatTime(timerRef.current)}
              </h3>
              <h3 className="mt-3 mb-2">Total Tries : {tries}</h3>
              <button onClick={resetGame} className="custombutton mb-4 mt-3">
                Play Again
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3>Question:</h3>
                <div className="d-flex flex-row flex-wrap justify-content-center mb-3">
                  {questionData.question.map((src, index) => {
                    return (
                      <img
                        key={index}
                        src={images.current[src]}
                        draggable={false}
                        className="img-thumbnail m-1 dragImg"
                        width="100"
                        height="100"
                        alt={`question-${index}`}
                      />
                    );
                  })}
                </div>
              </div>

              <h3>Answer Box:</h3>
              <div className="mb-4 d-flex justify-content-center align-items-center">
                <DroppableBox
                  answerImages={answerImages}
                  setAnswerImages={setAnswerImages}
                  maxItems={questionData.question.length}
                  borderClass={borderClass}
                />
              </div>

              <div className="d-flex justify-content-center align-items-center">
                {/* <h3 className="m-4">Options:</h3> */}
                <div className="d-flex flex-row flex-wrap justify-content-center m-1">
                  {Object.keys(images.current).map((src, index) => (
                    <DraggableImage
                      key={index}
                      src={images.current[src]}
                      index={index}
                    />
                  ))}
                </div>
                {!submitted && !gameOver && (
                  <button onClick={handleSubmit} className="custombutton m-4">
                    Submit
                  </button>
                )}

                {submitted && !gameOver && (
                  <p
                    className={`warning m-4 ${
                      warning.includes("Correct")
                        ? "btn btn-success"
                        : "btn btn-danger"
                    }`}
                  >
                    {warning}
                  </p>
                )}
              </div>

              {showConfetti && <Confetti />}
              <br />
            </>
          )}
        </div>
      </div>

      <style>
        {`.hover-effect {
              cursor: pointer;
              box-shadow: 0px 0px 0px 0px;
              transition: transform 0.3s, box-shadow 0.3s;
          }
    
          .hover-effect:hover {
              transform: translateY(-5px);
              box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.5);
          }
    
          .main-container {
            display: flex;
          }
    
          .left-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 20px;
          }
    
          .left-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }
    
          .container.main {
            flex-grow: 1;
          }
            .custom-tooltip .tooltip-inner {
            background-color: black; /* Background color of tooltip */
            color: white; /* Text color of tooltip */
            border-radius: 5px; /* Rounded corners of tooltip */
            padding: 10px; /* Padding of tooltip */
            
            
        }

       
          
          `}
      </style>
    </DndProvider>
  );
};

export default QuestionPage;
