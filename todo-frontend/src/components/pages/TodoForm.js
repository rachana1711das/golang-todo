import React, { Component } from 'react';
import Timer from '../common/Timer';

class AddTodo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      reminder: null
    };
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { title, reminder } = this.state;
    if (!title) return;
    if (!reminder) return;

    this.props.addTodo(title, reminder);
    this.setState({
      title: '',
      reminder: null
    });
  };

  handleTitleChange = (e) => {
    this.setState({ title: e.target.value });
  };



  render() {
    const { title, reminder } = this.state;

    return (
      <div className="mb-4 p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={this.handleSubmit} className="flex flex-col items-center">
          <input
            type="text"
            placeholder="Enter todo title"
            value={title}
            onChange={this.handleTitleChange}
            className="border border-gray-300 rounded py-2 px-4 mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
          />
          <Timer setReminder={(reminder) => this.setState({ reminder })} />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mt-4 w-80"
          >
            Add Reminder
          </button>
        </form>
      </div>
    );
  }
}

export default AddTodo;
