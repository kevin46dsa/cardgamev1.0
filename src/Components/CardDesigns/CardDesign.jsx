import React, { useMemo } from 'react'

/**
 * Card Design Component that renders the card with text
 * @props {string} message - message to display on the card
 * @returns jsx element
 */

const CardDesign = (props) => {
    const {title = "Game Title", message = "E2E test message props",desiredHeight = 500} = props



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

    const cardStyle = {
        width: `${width}px`,
        height: `${height}px`,
        border: "2px solid #000",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#fff",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        margin: "10px",
      };
    
      const titleStyle = {
        fontSize: "20px",
        fontWeight: "bold",
        marginBottom: "10px",
      };
    
      const contentStyle = {
        fontSize: "16px",
      };
  return (
    <div style={cardStyle}>
    <div style={titleStyle}>{title}</div>
    <div style={contentStyle}>{message}</div>
  </div>
  )
}

export default CardDesign