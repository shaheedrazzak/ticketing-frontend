import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [availableTickets, setAvailableTickets] = useState(0);
  const [soldTickets, setSoldTickets] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(200);
  const [error, setError] = useState(null);
  const [ticketData, setTicketData] = useState([]);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  const [socket, setSocket] = useState(null); // Added socket state

  // WebSocket connection setup with cleanup
  useEffect(() => {
    const newSocket = new WebSocket('wss://ticketing-backend-production.up.railway.app');
    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'init') {
        setAvailableTickets(data.availableTickets);
        setSoldTickets(data.soldTickets);
        setMaxCapacity(data.maxCapacity);
        setTicketData([]); // Clear old graph data on initialization
      }

      if (data.type === 'update') {
        setAvailableTickets(data.availableTickets);
        setSoldTickets(data.soldTickets);

        // Update graph data
        setTicketData((prevData) => {
          const newData = [
            ...prevData,
            { time: new Date().toLocaleTimeString(), tickets: data.availableTickets },
          ];

          // Limit to 10 data points
          if (newData.length > 10) newData.shift();

          return newData;
        });
      }
    };

    newSocket.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection error');
    };

    newSocket.onclose = (event) => {
      if (!event.wasClean) {
        setError('WebSocket closed unexpectedly');
        console.error('WebSocket closed unexpectedly', event);
      } else {
        console.log('WebSocket closed cleanly');
      }
    };

    // Cleanup WebSocket connection on component unmount
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, []); // Empty dependency array ensures WebSocket is set up only once

  const handleAddTickets = () => {
    const amount = parseInt(addAmount);
    if (!isNaN(amount) && amount > 0) {
      socket.send(JSON.stringify({ type: 'add', tickets: amount }));
      setAddAmount('');
    } else {
      alert('Please enter a valid number of tickets to add.');
    }
  };

  const handlePurchaseTickets = () => {
    const amount = parseInt(purchaseAmount);
    if (!isNaN(amount) && amount > 0) {
      socket.send(JSON.stringify({ type: 'purchase', tickets: amount, isVIP }));
      setPurchaseAmount('');
    } else {
      alert('Please enter a valid number of tickets to purchase.');
    }
  };

  const chartData = {
    labels: ticketData.map((data) => data.time),
    datasets: [
      {
        label: 'Available Tickets',
        data: ticketData.map((data) => data.tickets),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div className="App">
      <h1>Event Ticketing System</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <div>
          <p>Available Tickets: {availableTickets}</p>
          <p>Tickets Sold: {soldTickets}</p>
          <p>Max Capacity: {maxCapacity}</p>

          <div>
            <h3>Add Tickets</h3>
            <input
              type="number"
              placeholder="Enter tickets to add"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
            />
            <button onClick={handleAddTickets}>Add Tickets</button>
          </div>

          <div>
            <h3>Purchase Tickets</h3>
            <input
              type="number"
              placeholder="Enter tickets to purchase"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
            />
            <button onClick={handlePurchaseTickets}>Purchase Tickets</button>
          </div>

          <div>
            <h3>Are you a VIP?</h3>
            <label>
              <input
                type="checkbox"
                checked={isVIP}
                onChange={() => setIsVIP(!isVIP)}
              />
              VIP Status
            </label>
          </div>

          <div>
            <h3>Real-Time Ticket Dashboard</h3>
            <Line data={chartData} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
