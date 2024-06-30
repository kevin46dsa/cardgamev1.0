import React,{useEffect, useState} from 'react'
import FormSelect from 'react-bootstrap/FormSelect'

import { getDocs,collection} from "firebase/firestore";
import { db } from "../../firebase"
import FormUpdate from './FormUpdate';

const Update = () => {

  const [game, setGame] = useState('');
  const [options, setOptions] = useState([]);
  const [data, setData] = useState({})



  useEffect(() => {

    const fetchData = async () => {
      const docRef = collection(db, 'game');
    const querySnapshot = await getDocs(docRef);

    querySnapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data())
      setOptions((oldArray) => [...oldArray, doc.id])
      setData((oldData) => ({...oldData, [doc.id]:doc.data()}))
    })
  }

    
    fetchData();
  
  },[])

  return (
    <>
    <FormSelect size="lg" value={game} onChange={(e)=>setGame(e.target.value)}>
    <option>Select Game</option>
    {options.map((option) => (
     <option key={option} value={option}>{option}</option>
    ))}

    </FormSelect>
    <div>
      <FormUpdate variant={game} data={data}/>
    </div>
    </>
  )
}

export default Update