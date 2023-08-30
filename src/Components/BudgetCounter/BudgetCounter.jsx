import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { doc,getDoc,updateDoc,arrayUnion, Timestamp} from "firebase/firestore";
import { db } from "../../firebase"
import "./BudgetCounter.css"

function BudgetCounter()  {
    let { id } = useParams();
    let [allowance, setallowance] = useState("");
    let [showDebitForm, setshowdebitform] = useState(false);
    let [showCreditForm, setshowcreditform] = useState(false);
    const [TrasnHistory, setTransHistory] = useState([])
    const [formData, setFormData] = useState("")
        
    
    async function addDebit(){
        let amount = formData
        setFormData("")
        setshowdebitform(!showDebitForm)
        
        let newElement = {
            Amount: amount,
            Description:"Debit",
            Date: Timestamp.now()
        }
        
        const dbRef = doc(db, "Budgetcal", "trans");
        let updatedamount = parseFloat(allowance) - parseFloat(amount)
        await updateDoc(dbRef, {History: arrayUnion(newElement),Allowance:updatedamount});
        setallowance(updatedamount)
        setTransHistory((oldArray => [...oldArray, newElement]))

    }  


    async function addCredit(){
        
        let amount = formData
        setFormData("")
        setshowcreditform(!showCreditForm)
        
        let newElement = {
            Amount: amount,
            Description:"Credit",
            Date: Timestamp.now()
        }
        
        const dbRef = doc(db, "Budgetcal", "trans");
        let updatedamount = parseFloat(allowance) + parseFloat(amount)
        await updateDoc(dbRef, {History: arrayUnion(newElement), Allowance: updatedamount});
        setallowance(updatedamount)
        setTransHistory((oldArray => [...oldArray, newElement]))
    }  

    function onChange(e){
        setFormData(e.target.value)
    }  
    
    useEffect(() => {
		async function fetchListings() {
            try {
                const docRef =  doc(db, "Budgetcal", "trans");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const Data = docSnap.data()
                    setallowance(Data.Allowance)
                    setTransHistory(Data.History)
                  } else {
                    // docSnap.data() will be undefined in this case
                    console.log("No such document!");
                  }
            } catch (error) {
                console.log(error);
            }      
		}
		fetchListings();
	}, []);

    setInterval(addCredit, 86400000)  

    if(id === 'kevin46dsa'){
    return (
        <div className="Maindiv">
            <div>
            <h2>Allowance</h2>
            <h3>$ {allowance}</h3>
            </div>
            <div>
            <button onClick={()=>setshowdebitform(!showDebitForm)}>  -  </button>
            <button onClick={()=>setshowcreditform(!showCreditForm)}>+</button>
            {showDebitForm && <div>
                <h3>Record A Debit</h3>
                <input
                    type="number"
                    id="number"
                    value={formData}
                    onChange={onChange}
                    placeholder="Enter Amount.."
                    maxLength="5"
                    required
                    className="form-control"
                />
                <button onClick={addDebit}>Submit</button>
            </div>}
            {showCreditForm && <div>
                <h3>Record A Credit</h3>
                <input
                    type="number"
                    id="number"
                    value={formData}
                    onChange={onChange}
                    placeholder="Enter Amount.."
                    maxLength="5"
                    required
                    className="form-control"
                />
                <button onClick={addCredit}>Submit</button>
            </div>}
            
            </div>
            <br/>
            <br/>
            <div>
                <h3>History</h3>
                <div className="scroll">
                <ul >
                {TrasnHistory.map((Transaction,index) => (
                    <li key={index}>
                        <p>{Transaction.Description} of ${Transaction.Amount} on {Transaction.Date.seconds}</p>
                    </li>
                ))}
            
                </ul>
                </div>
            </div>
         </div>
      );
    }
    };
    
export default BudgetCounter;