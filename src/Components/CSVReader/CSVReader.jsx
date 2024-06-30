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
            console.log(text)
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
    let formattedData = data.split(',');
    let finalData = formattedData.map((item,index) => {
        console.log(item)
        return item.replace(/"/g, '')
    })
    let filteredData = finalData.filter(item => item.trim() !== '' && item.trim() !== '\n');
    return filteredData;
}

  return (
    <>
    <h2>Upload CSV File</h2>
                <div>
                    <label htmlFor="csvFile">CSV File</label>
                    <input type="file" id="csvFile" accept=".csv" onChange={handleFileUpload} />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
    </>
  )
}

export default CSVReader