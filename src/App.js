import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css'; // Import CSS file for styling

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
  const [loading, setLoading] = useState(false);  // Loading state for WebSocket
  const [wsError, setWsError] = useState(null);   // WebSocket error state

  useEffect(() => {
    const socket = new WebSocket('wss://ticketing-backend-production.up.railway.app');

    socket.onopen = () => {
      setLoading(false);
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
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

    socket.onerror = (err) => {
      setLoading(false);
      setWsError('WebSocket connection error');
      console.error('WebSocket error:', err);
    };

    socket.onclose = (event) => {
      setLoading(false);
      if (!event.wasClean) {
        setWsError('WebSocket closed unexpectedly');
        console.error('WebSocket closed unexpectedly', event);
      } else {
        console.log('WebSocket closed cleanly');
      }
    };

    // Start loading when WebSocket is connecting
    setLoading(true);

    return () => {
      socket.close();
    };
  }, []); // Dependency array ensures WebSocket is set up only once

  // Handle adding tickets with form validation
  const handleAddTickets = () => {
    const amount = parseInt(addAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number of tickets to add.');
      return;
    }

    const socket = new WebSocket('wss://ticketing-backend-production.up.railway.app');
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'add', tickets: amount }));
      setAddAmount('');
    };
  };

  // Handle purchasing tickets with form validation
  const handlePurchaseTickets = () => {
    const amount = parseInt(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number of tickets to purchase.');
      return;
    }

    const socket = new WebSocket('wss://ticketing-backend-production.up.railway.app');
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'purchase', tickets: amount, isVIP }));
      setPurchaseAmount('');
    };
  };

  const chartData = {
    labels: ticketData.map((data) => data.time),  // Time labels for the chart
    datasets: [
      {
        label: 'Available Tickets',
        data: ticketData.map((data) => data.tickets),  // Data points for tickets
        borderColor: 'rgba(75, 192, 192, 1)',         // Line color
        fill: false,
      },
    ],
  };

  return (
    <div className="App">
      <h1>Event Ticketing System</h1>
      {error || wsError ? (
        <p style={{ color: 'red' }}>Error: {wsError || error}</p>
      ) : (
        <div className="dashboard">
          <p>Available Tickets: {availableTickets}</p>
          <p>Tickets Sold: {soldTickets}</p>
          <p>Max Capacity: {maxCapacity}</p>

          <div className="input-container">
            <h3>Add Tickets</h3>
            <input
              type="number"
              placeholder="Enter tickets to add"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="ticket-input"
            />
            <button onClick={handleAddTickets} className="btn">Add Tickets</button>
          </div>

          <div className="input-container">
            <h3>Purchase Tickets</h3>
            <input
              type="number"
              placeholder="Enter tickets to purchase"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="ticket-input"
            />
            <button onClick={handlePurchaseTickets} className="btn">Purchase Tickets</button>
          </div>

          <div className="vip-status">
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

          <div className="chart-container">
            <h3>Real-Time Ticket Dashboard</h3>
            {/* Show loading spinner if WebSocket is loading */}
            {loading ? <div className="loading-spinner"></div> : <Line data={chartData} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
