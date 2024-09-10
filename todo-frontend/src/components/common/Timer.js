import React, { Component } from 'react';
import { formatISO } from 'date-fns';


class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: ''
    };
  }

  handleChange = (e) => {
    const selectedTime = e.target.value;
    this.setState({ time: selectedTime });

    // Check if selectedTime is not an empty string
    if (selectedTime) {
      const formattedTime = formatISO(new Date(selectedTime));
      this.props.setReminder(formattedTime);
    } else {
      // If selectedTime is empty, set reminder to null or handle it according to your logic
      this.props.setReminder(null); // Or handle it based on your application logic
    }
  };



  render() {
    return (
      <input
        type="datetime-local"
        value={this.state.time}
        onChange={this.handleChange}
        className="border rounded py-2 px-3 mr-2 w-80"
      />
    );
  }
}



export default Timer;
