import React from 'react'
import { Button } from 'react-bootstrap'

const GenerateFolder = () => {

const generateFolder = async () => {
        fetch('http://localhost:3000/download-zip')
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'DJ_Music_Organizer.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(error => console.error('Error downloading zip:', error));
    
}



  return (
    <div><Button onClick={generateFolder}>Generate Folder</Button></div>
  )
}

export default GenerateFolder