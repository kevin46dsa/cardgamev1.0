import React, { useState } from 'react'
import CSVReader from '../CSVReader/CSVReader'



const NeverHaveIEver = (props) => {
     const {data,updateArray} = props
     const [csvData, setCsvData] = useState([]);
     const [questions, setQuestions] = useState('')

     const handleSubmit = (e) => {
        e.preventDefault()
        if(csvData.length === 0){
            updateArray(questions,"Questions",'add')
        }
        else {
            updateArray(csvData,"Questions",'add')
        }
     }

    return (
        <>
        <h1>NeverHaveIEver</h1>
        <h2>Add Questions</h2>
       
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column'}}>
  <div style={{ marginBottom: '10px' }}>
      <CSVReader setState={setCsvData} />

  </div>
  <h5>OR</h5>
  <div style={{ marginBottom: '10px' }}>
    <label htmlFor="question">
      Enter Question:
      <input type="text" id="question" placeholder="Enter Question" onChange={(e)=>setQuestions(e.target.value)} />
    </label>
  </div>
  <button type='submit'>Add</button>
</form>
<br/>
<br/>
        <h2>Questions</h2>
        <div style={{overflow:"auto", height:"400px"}}>
        {data && data.Questions.map((item,index) => { return (<div style={{ display: 'flex', alignItems: 'center' }} key={index}><p>{item}</p>
        <button onClick={()=>updateArray(item,"Questions",'remove')}>X</button></div>
         )})}
        </div>
        </>
    )
}

export default NeverHaveIEver