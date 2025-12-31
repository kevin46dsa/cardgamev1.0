import React from 'react'
import NeverHaveIEver from './NeverHaveIEver'
import { doc,  updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../firebase"


const FormUpdate = (props) => {
    const {variant,data} = props

   



    const updateArray = async (value, fieldName, updateArrayType) => {
      const gameRef = doc(db, 'game', variant);

      
      try {

          if (Array.isArray(value)) await updateDoc(gameRef, {[fieldName]: arrayUnion(...value)});
          else{
            console.log('value',value)
          if (updateArrayType === 'add') {
              await updateDoc(gameRef, {
                  [fieldName]: arrayUnion(value)
              });
          } else if (updateArrayType === 'remove') {
              await updateDoc(gameRef, {
                  [fieldName]: arrayRemove(value)
              });
          }
        }
          console.log(`Document successfully updated: ${updateArrayType} ${value} to/from ${fieldName}`);
      } catch (error) {
          console.error("Error updating document: ", error);
      }
  }

    

    switch (variant) {
        case "Neverhaveiever":
            return <NeverHaveIEver data={data[variant]} updateArray={updateArray} variant={variant}/>
        case "TruthorDare":
            return <div>Two</div>
        case "3":
            return <div>Three</div>
        default:
            return <div>Select Game</div>
    }

}

export default FormUpdate