import React from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import { useParams } from 'react-router-dom'
import CreateNewGame from '../CreateNewGame/CreateNewGame'
import Uploader from '../Uploader/Uploader'
import UploaderMoreImage from '../Uploader/UploaderMoreImage'
import Update from '../Update/Update'

const ADMIN_ID = "kevin46dsa";

const UpdateMenu = () => {
  const { id } = useParams();

  if (id !== ADMIN_ID) {
    return (
      <h1 style={{ display: "flex", justifyContent: 'center', padding: "50px" }}>
        Page not found
      </h1>
    );
  }

  return (
    <>
      <h1 style={{ display: "flex", justifyContent: 'center' }}>Game Builder</h1>
      <Tabs
        defaultActiveKey="profile"
        id="uncontrolled-tab-example"
        className="mb-3"
      >
        <Tab eventKey="Create New Game" title="Create New Game">
          <CreateNewGame/>
        </Tab>
        <Tab eventKey="Update Game" title="Update Game">
          <Update/>
        </Tab>
        <Tab eventKey="Uploader" title="Uploader">
          <Uploader/>
        </Tab>
        <Tab eventKey="Upload More" title="Upload More">
          <UploaderMoreImage/>
        </Tab>
      </Tabs>
    </>
  )
}

export default UpdateMenu
