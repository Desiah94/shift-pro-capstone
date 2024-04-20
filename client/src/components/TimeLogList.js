import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

function TimeLogList() {
  const { postTimeLog, updateTimeLog, deleteTimeLog } = useContext(AuthContext);
  const getCurrentPayrollStart = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    return startOfWeek;
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentPayrollStart());
  const [data, setData] = useState([]);
  const [allTimeLogs, setAllTimeLogs] = useState([]);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: '',
    clockIn: '',
    clockOut: '',
    hoursWorked: '',
    totalHours: '',
    status: 'Pending'
  });
  const [noTimeLogMessage, setNoTimeLogMessage] = useState('');
  const [hoursForSelectedDate, setHoursForSelectedDate] = useState(0);
  const [submitClicked, setSubmitClicked] = useState(false);

  useEffect(() => {
    if (submitClicked) {
      fetchData();
    }
    fetchAllTimeLogs();
  }, [selectedDate, submitClicked]);

  const fetchAllTimeLogs = async () => {
    try {
      const response = await fetch('/timelogs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch timelogs');
      const data = await response.json();
      setAllTimeLogs(data.timeLogs);
    } catch (error) {
      console.error('Error fetching all time logs:', error);
    }
  };

  const fetchData = () => {
    const timeLogsForSelectedDate = data.filter(entry => entry.date === selectedDate.toISOString().split('T')[0]);
    setNoTimeLogMessage(timeLogsForSelectedDate.length === 0 ? 'No time log present.' : '');
    let totalHours = 0;
    timeLogsForSelectedDate.forEach(log => {
      totalHours += parseFloat(log.hoursWorked);
    });
    setHoursForSelectedDate(totalHours);
  };

  const handleCellEdit = (newValue, rowIndex, field) => {
    setData(prevData => {
      const updatedData = [...prevData];
      updatedData[rowIndex][field] = newValue;
      if (field === 'clockIn' || field === 'clockOut') {
        const clockIn = updatedData[rowIndex].clockIn;
        const clockOut = updatedData[rowIndex].clockOut;
        let totalHours = 0;
        if (clockIn && clockOut) {
          const [hoursIn, minutesIn] = clockIn.split(':').map(Number);
          const [hoursOut, minutesOut] = clockOut.split(':').map(Number);
          totalHours = (hoursOut - hoursIn) + (minutesOut - minutesIn) / 60;
          if (totalHours < 0) totalHours += 24;
        }
        updatedData[rowIndex].hoursWorked = totalHours.toFixed(2);
        let totalWorkedHours = 0;
        updatedData.forEach(entry => {
          if (!isNaN(entry.hoursWorked)) {
            totalWorkedHours += parseFloat(entry.hoursWorked);
          }
        });
        updatedData[rowIndex].totalHours = totalWorkedHours.toFixed(2);
      }
      return updatedData;
    });
    saveDataToBackend();
  };

  const saveDataToBackend = () => {
    // Logic to save data to backend
  };

  const handleSaveSubmit = () => {
    setEditingRowIndex(null);
    postTimeLog(data);
  };

  const handleEditRow = (rowIndex) => {
    setEditingRowIndex(rowIndex);
  };

  const handleDeleteRow = async (rowIndex) => {
    const timeLogId = data[rowIndex].id; // Assuming each entry has an ID
    const updatedData = [...data];
    updatedData.splice(rowIndex, 1);
    setData(updatedData);
    saveDataToBackend(updatedData);
    try {
      await deleteTimeLog(timeLogId); // Delete the entry from the backend
      console.log('Time log deleted successfully');
    } catch (error) {
      console.error('Error deleting time log:', error);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleAddNewEntry = () => {
    const updatedData = [...data, newEntry];
    setData(updatedData);
    saveDataToBackend(updatedData);
    setNewEntry({
      date: '',
      clockIn: '',
      clockOut: '',
      hoursWorked: '',
      totalHours: '',
      status: 'Pending'
    });
  };

  const handleSubmit = () => {
    setSubmitClicked(true);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
  };

  return (
    <div className="time-log-list-container">
      <h2>Time Log List</h2>
      <div className="calendar-dropdown">
        <label htmlFor="selectedDate">Select Date:</label>
        <input type="date" id="selectedDate" name="selectedDate" value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} onChange={(e) => handleDateChange(new Date(e.target.value))} />
        <button onClick={handleSubmit}>Submit</button>
      </div>
      <div className="admin-dashboard-content">
        {noTimeLogMessage && <p>{noTimeLogMessage}</p>}
        {data.length > 0 && (
          <table className="time-log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours Worked</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, rowIndex) => (
                <tr key={rowIndex}>
                  <td>
                    {editingRowIndex === rowIndex ? (
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleCellEdit(e.target.value, rowIndex, 'date')}
                      />
                    ) : (
                      entry.date
                    )}
                  </td>
                  <td>
                    {editingRowIndex === rowIndex ? (
                      <input
                        type="time"
                        value={entry.clockIn}
                        onChange={(e) => handleCellEdit(e.target.value, rowIndex, 'clockIn')}
                      />
                    ) : (
                      formatTime(entry.clockIn)
                    )}
                  </td>
                  <td>
                    {editingRowIndex === rowIndex ? (
                      <input
                        type="time"
                        value={entry.clockOut}
                        onChange={(e) => handleCellEdit(e.target.value, rowIndex, 'clockOut')}
                      />
                    ) : (
                      formatTime(entry.clockOut)
                    )}
                  </td>
                  <td>{entry.hoursWorked}</td>
                  <td>{entry.totalHours}</td>
                  <td>{entry.status}</td>
                  <td>
                    {editingRowIndex === rowIndex ? (
                      <button onClick={() => handleSaveSubmit()}>
                        Save
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleEditRow(rowIndex)}>Edit</button>
                        <button onClick={() => handleDeleteRow(rowIndex)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div>
          <button onClick={handleAddNewEntry}>
            <span role="img" aria-label="plus-sign">+</span>
          </button>
        </div>
      </div>
      <div className="hours-table">
        <h3>All Time Logs</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Hours Worked</th>
              <th>Total Hours</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {allTimeLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.date}</td>
                <td>{formatTime(log.clock_in)}</td>
                <td>{formatTime(log.clock_out)}</td>
                <td>{log.hours_worked}</td>
                <td>{log.total_hours}</td>
                <td>{log.status}</td>
                <td>
                  <button onClick={() => handleEditRow(index)}>Edit</button>
                  <button onClick={() => handleDeleteRow(log.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TimeLogList;
