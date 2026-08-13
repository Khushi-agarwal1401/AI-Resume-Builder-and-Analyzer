"use client";

import { useEffect, useRef, useState } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSession } from "next-auth/react";

export function TourGuide() {
  const { data: session, status } = useSession();
  const hasRunRef = useRef(false);
  const [isActive, setIsActive] = useState(false);
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    // Only run if user is authenticated, we haven't run it yet, AND it's a new user (< 24h old)
    if (status !== "authenticated" || !session?.user?.id || hasRunRef.current) {
      return;
    }

    const isNewUser =
      session.user.createdAt &&
      Date.now() - new Date(session.user.createdAt).getTime() < 24 * 60 * 60 * 1000;

    if (!isNewUser) {
      return;
    }

    const tourKey = `has_seen_tour_${session.user.id}`;
    const hasSeenTour = localStorage.getItem(tourKey);

    if (!hasSeenTour) {
      hasRunRef.current = true;
      
      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        disableActiveInteraction: true,
        steps: [
          {
            element: '#tour-step-1',
            popover: {
              title: 'AI Resume Wizard',
              description: 'Start here to create a new resume or import an existing one using our AI tools.',
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '#tour-step-2',
            popover: {
              title: 'Create Resume',
              description: 'Start from scratch with a guided builder. Pick your level and we will scaffold it for you.',
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '#tour-step-4',
            popover: {
              title: 'Upload Resume',
              description: 'Upload an existing PDF, DOCX, or TXT resume and we will rebuild it for you.',
              side: "bottom",
              align: 'start'
            }
          }
        ],
        onDestroyStarted: () => {
          localStorage.setItem(tourKey, 'true');
          driverObj.destroy();
          setIsActive(false);
        },
        onNextClick: () => {
          const state = driverObj.getState();
          // If we are on step 1 (index 0) and going to step 2, we must open the modal first.
          if (state.activeIndex === 0) {
            const step2Btn = document.getElementById("tour-step-2");
            // Check if modal is already open
            if (step2Btn && step2Btn.offsetParent !== null) {
              driverObj.moveNext();
              return;
            }

            const step1Btn = document.getElementById("tour-step-1");
            if (step1Btn) {
              step1Btn.click();
              // Wait for the modal animation to finish before proceeding
              setTimeout(() => {
                driverObj.moveNext();
              }, 300);
              return;
            }
          }
          driverObj.moveNext();
        },
        onPrevClick: () => {
          const state = driverObj.getState();
          // If we are on step 2 (index 1) and going back to step 1, we must close the modal.
          if (state.activeIndex === 1) {
            const closeBtn = document.getElementById("close-create-modal");
            if (closeBtn) {
              closeBtn.click();
              setTimeout(() => {
                driverObj.movePrevious();
              }, 300);
              return;
            }
          }
          driverObj.movePrevious();
        }
      });

      driverRef.current = driverObj;

      // Wait a moment for the page to fully render before starting the tour
      setTimeout(() => {
        const step1Btn = document.getElementById("tour-step-1");
        if (step1Btn) {
          localStorage.setItem(tourKey, 'true');
          driverObj.drive();
          setIsActive(true);
        }
      }, 500);
    }
  }, [status, session]);

  if (!isActive) return null;

  return (
    <button
      onClick={() => {
        if (driverRef.current) {
          driverRef.current.destroy();
        }
        setIsActive(false);
      }}
      className="fixed top-4 right-6 z-[999999] px-4 py-2 bg-white text-gray-700 rounded-lg font-bold text-sm shadow-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2"
    >
      Skip Tour
    </button>
  );
}
