import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import { storeImage, onChangeFormDataHandler } from "../../Utils/Basic";
import { useToast } from "../../providers/ToastProvider";

const Uploader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    images: {},
  });
  const { name, images } = formData;

  async function onSubmit(e) {
    e.preventDefault();

    const Cards = await Promise.all(
      [...images].map((image) => storeImage(formData.name, image))
    ).catch(() => {
      notify("Images not uploaded", { variant: "danger" });
      return;
    });

    const formDataCopy = {
      ...formData,
      Cards,
      imgUrls: ["test"],
      rules: ["test"],
      timestamp: serverTimestamp(),
    };
    delete formDataCopy.images;
    await addDoc(collection(db, "truthordrink"), formDataCopy);
    notify("Game Added");
    navigate(`/`);
  }

  if (id !== "kevin46dsa") return null;

  return (
    <div>
      <h1>Upload a Game</h1>

      <main>
        <Card>
          <Form onSubmit={onSubmit}>
            <p>Name of the Game</p>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => onChangeFormDataHandler(e, setFormData)}
              placeholder="Name"
              maxLength="32"
              minLength="2"
              required
              className="form-control"
            />
            <div>
              <label htmlFor="images" className="form-label">
                Upload Images
              </label>
              <input
                type="file"
                id="images"
                onChange={(e) => onChangeFormDataHandler(e, setFormData)}
                accept=".jpg,.png,.jpeg,.webp"
                multiple
                required
                className="form-control"
              />
            </div>
            <br />
            <button type="submit" className="btn btn-success">
              Create Game
            </button>
          </Form>
        </Card>
      </main>
    </div>
  );
};

export default Uploader;
