import React, { useMemo } from 'react'
import './CardDesign.css'

/**
 * Card Design Component that renders the card with text
 * @props {string} message - message to display on the card
 * @returns jsx element
 */

const CardDesign = (props) => {
    const {title = "Game Title", message = "E2E test message props", desiredHeight = 500, drawId} = props

    const {width,height} = useMemo(()=>{
        const ratioHeight = 1011;
        const ratioWidth = 638;

        // Calculate the corresponding width based on the given height
        const calculatedWidth = (desiredHeight * ratioWidth) / ratioHeight;

        return {
          width: calculatedWidth.toString(),
          height: desiredHeight.toString(),
        };
    },[desiredHeight])

  return (
    <div className="card-viewport" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="card-face" key={drawId}>
        <div className="card-face-title">{title}</div>
        <div className="card-face-message">{message}</div>
      </div>
    </div>
  )
}

export default CardDesign
