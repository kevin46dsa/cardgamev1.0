import React,{useState} from 'react'


const CSVReader = (props) => {
    const {setState} = props
    const [error, setError] = useState('');

   

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    console.log(file)
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            let text = e.target.result;
            text = formatData(text);
            setState(text);
            setError('');
        };
        reader.onerror = () => {
            setError('Error reading file');
        };
        reader.readAsText(file);
    } else {
        setError('No file selected');
    }
};

const formatData = (data) => {
    let formattedData = data.split(',').map(item => item.replace(/\n/g, '').trim()) // Remove newline characters and trim whitespace
    .filter(item => item.length > 0); // Filter out empty strings;
    console.log(formattedData)
    return formattedData;
}

  return (
    <>
                <div>
                    <label htmlFor="csvFile">CSV File</label>
                    <input type="file" id="csvFile" accept=".csv" onChange={handleFileUpload} />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
    </>
  )
}

export default CSVReader