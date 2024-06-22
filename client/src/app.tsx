import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/navbar/navbar";
import { SignUp, LogIn } from "../components/sign-up-log-in";
import { signOut, checkAuthStatus } from "../lib/auth";

export default function App() {
  let [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWidth = useRef(750);
  const canvasHeight = useRef(220);

  function isCanvas(canvas: HTMLCanvasElement | null) {
    let ctx: CanvasRenderingContext2D | null;
    if (canvas) {
      ctx = canvas.getContext("2d");
    } else return;
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    return { canvas, ctx };
  }

  function scaleNumber(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ) {
    return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
  }

  function calculateShadow(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const isCanvasReturn = isCanvas(canvasRef.current);
    if (!isCanvasReturn) return;

    const { ctx } = isCanvasReturn;
    const containerDiv = containerRef.current as HTMLDivElement;
    const rect = containerDiv.getBoundingClientRect();
    const scaleRange = 3;
    let shadowPositionX: number;
    let shadowPositionY: number;
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    shadowPositionX = scaleNumber(
      mouseX,
      0,
      rect.width,
      scaleRange * -1 - scaleRange,
      scaleRange + scaleRange
    );

    shadowPositionY = scaleNumber(
      mouseY,
      0,
      rect.height,
      scaleRange * -1 - scaleRange,
      scaleRange + scaleRange
    );

    ctx.shadowOffsetX = shadowPositionX;
    ctx.shadowOffsetY = shadowPositionY;
  }

  useEffect(() => {
    checkAuthStatus(setIsLoggedIn);

    const isCanvasReturn = isCanvas(canvasRef.current);
    if (!isCanvasReturn) return;

    const { canvas, ctx } = isCanvasReturn;
    canvas.width = canvasWidth.current;
    canvas.height = canvasHeight.current;

    ctx.shadowColor = "rgb(34 211 238)";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 30;

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = "150px roboto";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    function movingTextShadow() {
      ctx.clearRect(0, 0, canvasWidth.current, canvasHeight.current);
      ctx.fillStyle = `${isDarkMode ? "white" : "black"}`;
      ctx.fillText(
        "Chatvious",
        canvasWidth.current / 2,
        canvasHeight.current / 2
      );

      requestAnimationFrame(movingTextShadow);
    }
    movingTextShadow();
  }, [isDarkMode]);

  return (
    <div ref={containerRef} className="flex flex-col h-screen antialiased">
      <Navbar setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} />
      {/* Main */}
      <div
        onMouseMove={(e) => {
          calculateShadow(e);
        }}
        className="grow flex flex-col justify-center items-center gap-y-4"
      >
        {/* Main title */}
        <canvas
          className="w-[90%] sm:w-[75%] md:w-[60%] xl:w-[50%] h-50"
          id="canvasTitle"
          ref={canvasRef}
        >
          <div className="relative flex justify-center items-center">
            <div className="absolute -z-10 title-shadow w-full"></div>
            <h1
              className={`font-bold text-7xl xsm:text-8xl sm:text-9xl ${
                isDarkMode && "text-white"
              }`}
            >
              Chatvious
            </h1>
          </div>
        </canvas>
        <div className="space-x-6">
          {isLoggedIn ? (
            <button className="btn btn-accent" onClick={signOut}>
              Log Out
            </button>
          ) : (
            <>
              <SignUp className="btn btn-accent" />
              <LogIn className="btn btn-accent" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
