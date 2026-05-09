import React, { useEffect, useState } from "react";
import "./RemoteCursors.css";

const INACTIVE_THRESHOLD_MS = 3000;
const FADE_CHECK_INTERVAL_MS = 500;

/**
 * Renders remote user cursors as colored arrows with name labels.
 * Cursors fade out when the remote user's tab becomes inactive.
 * @param {Object} props
 * @param {Array<{id: string, color: string, name: string, x: number, y: number, lastActive: number}>} props.cursors
 * @returns {React.ReactElement|null}
 */
function RemoteCursors({ cursors }) {
  const [now, setNow] = useState(Date.now());

  /**
   * Periodically updates the current timestamp to drive fade-out checks.
   */
  useEffect(() => {
    try {
      if (!cursors?.length) return;

      const interval = setInterval(() => {
        try {
          setNow(Date.now());
        } catch (error) {
          /* timer tick */
        }
      }, FADE_CHECK_INTERVAL_MS);

      return () => {
        try {
          clearInterval(interval);
        } catch (error) {
          /* cleanup */
        }
      };
    } catch (error) {
      return undefined;
    }
  }, [cursors?.length]);

  try {
    if (!cursors?.length) return null;

    return (
      <>
        {cursors.map((cursor) => {
          try {
            const isInactive = now - (cursor?.lastActive || 0) > INACTIVE_THRESHOLD_MS;

            return (
              <div
                key={cursor?.id}
                className={`remote-cursor${isInactive ? " remote-cursor--inactive" : ""}`}
                style={{
                  top: cursor?.y,
                  left: cursor?.x,
                }}
              >
                <svg
                  className="remote-cursor__arrow"
                  width="20"
                  height="24"
                  viewBox="0 0 20 24"
                  fill="none"
                >
                  <path
                    d="M2.5 1L18 13H8.5L2.5 23V1Z"
                    fill={cursor?.color || "#999"}
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  className="remote-cursor__label"
                  style={{ backgroundColor: cursor?.color || "#999" }}
                >
                  {cursor?.name || "User"}
                </div>
              </div>
            );
          } catch (error) {
            return null;
          }
        })}
      </>
    );
  } catch (error) {
    return null;
  }
}

export default RemoteCursors;
