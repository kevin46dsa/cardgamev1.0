import React, { useState } from 'react';
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
  } from "firebase/storage";
  import { addDoc, collection, serverTimestamp } from "firebase/firestore";
 
  import { useNavigate,useParams } from "react-router-dom";
  import { db } from "../../firebase"
  import Card from "react-bootstrap/Card"
  import Form from 'react-bootstrap/Form';

  const Uploader = () => {
    let { id } = useParams();
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    images: {},
  });
  const {
    name,
    images,
  } = formData;
  function onChange(e) {
    let boolean = null;
    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }
    // Files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }
    // Text/Boolean/Number
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  }
  async function onSubmit(e) {
    e.preventDefault();
    


    async function storeImage(image) {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const filename = `${formData.name}-${image.name}`;
        const storageRef = ref(storage, filename);
        const uploadTask = uploadBytesResumable(storageRef, image);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
              default:
                  console.log(`Sorry, Something went wrong`);
            }
          },
          (error) => {
            // Handle unsuccessful uploads
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    }

    const Cards = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch((error) => {
      alert("Images not uploaded");
      return;
    });
    console.log(Cards)
    const formDataCopy = {
      ...formData,
      Cards,
      imgUrls:["test"],
      rules:["test"],
      timestamp: serverTimestamp(),
    };
    delete formDataCopy.images;
    await addDoc(collection(db, "truthordrink"), formDataCopy);
    alert("Game Added");
    navigate(`/`);
  }
if(id === 'kevin46dsa'){
	return (
        <div>
			<h1>Upload a Game</h1>
        
         <main>
         <Card>
         <Form onSubmit={onSubmit}>
           
           <p >Name of the Game</p>
           <input
             type="text"
             id="name"
             value={name}
             onChange={onChange}
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
               id="images"
               onChange={onChange}
               accept=".jpg,.png,.jpeg,.webp"
               multiple
               required
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
         </Card>
       </main>
       </div>
    )
};
}

export default Uploader;