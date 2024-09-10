import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from './withRouter'; // Import the custom HOC
import TodoList from './components/pages/TodoList';
import AddTodo from './components/pages/TodoForm';
import LoginModal from './components/common/LoginModal'

const CLIENT_ID = '507902628025-802u01eo3fh0l6na499jqfqondak37rb.apps.googleusercontent.com'; // Replace with your Google Client ID
const accessToken = localStorage.getItem('accessToken');

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      isAuthenticated: false,
      showLoginModal: false // State to manage re-login modal visibility
    };
  }

  componentDidMount() {
    this.fetchTodos();

    // Check for authorization code in the URL
    const searchParams = new URLSearchParams(this.props.location.search);
    const code = searchParams.get('code');
    if (accessToken ) {
      this.handleGoogleCallback(code);
    }
  }
  checkAuthStatus = () => {
    // const accessToken = localStorage.getItem('accessToken');
    const isAuthenticated = !!accessToken;
    if (isAuthenticated) {
      this.setState({ isAuthenticated: true });
    } else{
      this.setState({ isAuthenticated: false });

    }
  };

  handleGoogleLogin = () => {
    window.location.href = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${window.location.origin}&response_type=code&scope=https://www.googleapis.com/auth/calendar`;
  };

  // handleGoogleCallback = async (code) => {
  //   try {
  //     const response = await axios.post('http://localhost:8000/api/oauth2callback', { code });
  //     console.log(response, "response")
  //     const accessToken = response.data.accessToken; // Assuming the access token is returned in the response
  //     localStorage.setItem('accessToken', accessToken);
  //     this.setState({ isAuthenticated: true });
  //     alert('You are logged in set calender reminder');
  //   } catch (error) {
  //     console.error('Error during Google OAuth2 callback:', error);
  //   }
  // };

  handleGoogleCallback = async (code) => {
    try {
      const response = await axios.post('http://localhost:8000/api/oauth2callback', { code });
      const setAccessToken = response.data.access_token; 
      localStorage.setItem('accessToken', setAccessToken);
      this.setState({ isAuthenticated: true });
      alert('You are logged in and the access token is stored.');
      this.fetchTodos(); // Fetch todos after successful authentication
    } catch (error) {
      console.error('Error during Google OAuth2 callback:', error);
    }
  };

  fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/todos');
      this.setState({ todos: response.data });
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  toggleLoginModal = (show) => {
    this.setState({ showLoginModal: show });
  };

  addReminderToGoogleCalendar = async (title, reminder) => {
    this.checkAuthStatus();
console.log(this.state.isAuthenticated,"auth")
    if (!this.state.isAuthenticated) {
      // If not authenticated, show login modal
      this.toggleLoginModal(true);
      return;
    } else {
      try {
        await axios.post('http://localhost:8000/api/reminder', { title, reminder });
      } catch (error) {
        console.error('Error adding reminder to Google Calendar:', error);
      }
    }
  };

  addTodo = async (title, reminder) => {
    console.log(reminder, "reminder")

    try {
      const response = await axios.post('http://localhost:8000/api/todos', { title, reminder });
      if(this.state.todos){
        this.setState(prevState => ({
          todos: [...prevState.todos, response.data]
        }));
      }else{
        this.setState(prevState => ({
          todos: [ response.data]
        }));
      }
     

    } catch (error) {
      console.error('Error adding todo:', error);
    }

  };

  editTodo = async (id, updatedTodo) => {
    try {
      await axios.put(`http://localhost:8000/api/todos/${id}`, updatedTodo);
      this.setState(prevState => ({
        todos: prevState.todos.map(todo =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        )
      }));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  deleteTodo = async id => {
    try {
      await axios.delete(`http://localhost:8000/api/todos/${id}`);
      this.setState(prevState => ({
        todos: prevState.todos.filter(todo => todo.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };
  handleCloseModal = () => {
    this.setState({ showLoginModal: false });
  };


  render() {
    return (
      <div className="flex flex-col h-screen">
        <div className="bg-blue-400 p-4">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">Remind Me</h1>
        </div>
        <div className="flex-grow mt-8 flex justify-center">
          <div className="max-w-6xl w-full">
            <div className="bg-green-400 rounded-lg p-6 mb-4">
              <div className='flex flex-row justify-between'>
                <h2 className="text-xl font-bold mb-4">Add Reminder</h2>
                <div className="flex justify-center mb-4">
                  {/* Render login modal if not authenticated */}
                  {this.state.showLoginModal && (
                    <LoginModal onRelogin={this.handleGoogleLogin} onClose={this.handleCloseModal} />
                  )}
                </div>
              </div>
              <AddTodo addTodo={this.addTodo} />
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="max-w-6xl w-full">
            <div className="bg-yellow-400 rounded-lg p-6">
              <TodoList
                todos={this.state.todos}
                editTodo={this.editTodo}
                deleteTodo={this.deleteTodo}
                addReminderToGoogleCalendar={this.addReminderToGoogleCalendar}
                isAuthenticated={this.state.isAuthenticated}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(App);
