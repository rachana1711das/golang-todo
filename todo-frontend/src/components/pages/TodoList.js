import React, { Component } from 'react';
import { RiEdit2Line, RiDeleteBin6Line, RiAlarmWarningLine } from 'react-icons/ri';

class TodoList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editableTodo: null,
    };
  }

  handleEdit = (todo) => {
    this.setState({ editableTodo: todo });
  };

  handleSave = () => {
    const { editableTodo } = this.state;
    this.props.editTodo(editableTodo.id, editableTodo);
    this.setState({ editableTodo: null });
  };

  handleCancel = () => {
    this.setState({ editableTodo: null });
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      editableTodo: {
        ...prevState.editableTodo,
        [name]: value,
      },
    }));
  };



  handleSetReminder = (id) => {
    const filteredTodos = this.props.todos.filter(todo => todo.id === id);
    this.props.addReminderToGoogleCalendar(filteredTodos[0].title, filteredTodos[0].reminder);
  };


  render() {
    const { todos, deleteTodo } = this.props;
    const { editableTodo } = this.state;

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Reminders</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b float-start">Title</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {todos ? todos.map((todo) => (
              <tr key={todo.id} className="hover:bg-gray-100">
                {editableTodo && editableTodo.id === todo.id ? (
                  <>
                    <td className="py-2 px-4 border-b">
                      <input
                        type="text"
                        name="title"
                        value={editableTodo.title}
                        onChange={this.handleChange}
                        className="border rounded py-2 px-3 w-full"
                      />
                    </td>
                    <td className="py-2 px-4 border-b flex">
                      <button
                        onClick={this.handleSave}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                      >
                        OK
                      </button>
                      <button
                        onClick={this.handleCancel}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-4 border-b">{todo.title}</td>
                    <td className="py-2 px-4 mr-10 border-b flex items-center justify-center ml-8">
                      <RiEdit2Line
                        className="text-blue-500 cursor-pointer"
                        onClick={() => this.handleEdit(todo)}
                      />
                      <RiDeleteBin6Line
                        className="text-red-500 cursor-pointer ml-4"
                        onClick={() => deleteTodo(todo.id)}
                      />
                      <button
                        className="ml-4 text-yellow-500 cursor-pointer focus:outline-none"
                        onClick={() => this.handleSetReminder(todo.id)}
                      >
                        <RiAlarmWarningLine />
                      </button>
                    </td>

                  </>
                )}
              </tr>
            )) : <p className='text-center w-full'>No Reminders</p>}
          </tbody>
        </table>
      </div>
    );
  }
}

export default TodoList;
