import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import { setDoc, collection,serverTimestamp, doc } from "firebase/firestore";
import { storeImage,onChangeFormDataHandler } from '../../Utils/Basic';
import { db } from '../../firebase';

/**
 * 
 * @param {} props 
 * @returns jsx element
 */
const CreateNewGame = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        thumbnail: {},
        cards:{},
      });

      const {
        name,
        thumbnail,
        cards,

      } = formData;

      

    async function onSubmit(e) {
        e.preventDefault();

        if(!name){
          alert("Name is required");
          return;
        }

        if(!thumbnail){
            alert("Thumbnail is required");
            return;
        }
        console.log(cards)

        let thumbnailUrl = await storeImage(name,thumbnail[0])

 
        let Cards = [];
        if(Object.keys(cards).length !== 0 && cards.constructor === Object){
         Cards = await Promise.all(
          [...cards].map((image) => storeImage(name,image))
        ).catch((error) => {
          alert("Images not uploaded");
          return;
        });
    }

        const formDataCopy = {
          ...formData,
          name,
          imgUrls: [thumbnailUrl],
          rules:["Insert Image URL of rules"],
          timestamp: serverTimestamp(),
        };

        // Remove the images from the form data
        delete formDataCopy.thumbnail 
        delete formDataCopy.cards

        // Add the game to the database
        await setDoc(doc(db, `game`,name), formDataCopy);
        alert("Game Added");
        navigate(`/`);
      }

  return (
    <>
    <div>CreateNewGame</div>
    <Form onSubmit={onSubmit}>
           
           <p >Name of the Game</p>
           <input
             type="text"
             id="name"
             value={name}
             onChange={(e)=>onChangeFormDataHandler(e,setFormData)}
             placeholder="Name"
             maxLength="32"
             minLength="2"
             required
             className="form-control"
           />
           <div>
             <label htmlFor="formFileMultiple" className="form-label">Upload Images</label>
             <input
               type="file"
               id="thumbnail"
               onChange={(e)=>{
                console.log(e)
                onChangeFormDataHandler(e,setFormData)}

                }
               accept=".jpg,.png,.jpeg,.webp"
               required
               className="form-control"
             />
           </div>
           <div>
             <label htmlFor="formFileMultiple" className="form-label">Upload Images</label>
             <input
               type="file"
               id="cards"
               onChange={(e)=>{
                console.log(e)
                onChangeFormDataHandler(e,setFormData)}

                }
               accept=".jpg,.png,.jpeg,.webp"
               multiple
               className="form-control"
             />
           </div>
           <br/>
           <button
             type="submit"
             className="btn btn-success"
           >
             Create Game
           </button>
         </Form>

    </>
  )
}

export default CreateNewGame