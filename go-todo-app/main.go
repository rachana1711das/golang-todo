package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

var (
	todos  []Todo
	config *oauth2.Config
)

type Todo struct {
	ID       string    `json:"id"`
	Title    string    `json:"title"`
	Status   string    `json:"status"`
	Time     time.Time `json:"time"`
	Reminder string    `json:"reminder"` // Reminder time
}

func init() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	b, err := os.ReadFile("credentials.json")
	if err != nil {
		log.Fatalf("Unable to read client secret file: %v", err)
	}

	config, err = google.ConfigFromJSON(b, calendar.CalendarScope)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}
}

func getClient(tok *oauth2.Token) *http.Client {
	return config.Client(context.Background(), tok)
}

func saveToken(path string, token *oauth2.Token) {
	fmt.Printf("Saving credential file to: %s\n", path)
	f, err := os.Create(path)
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
}

func tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

func exchangeCode(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tok, err := config.Exchange(context.Background(), body.Code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	saveToken("token.json", tok)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tok)
}

func addReminderToGoogleCalendar(summary, description, startTime string) error {
	tok, err := tokenFromFile("token.json")
	if err != nil {
		return fmt.Errorf("unable to retrieve token from file: %v", err)
	}

	client := getClient(tok)
	srv, err := calendar.New(client)
	if err != nil {
		return fmt.Errorf("unable to retrieve Calendar client: %v", err)
	}

	startTimeParsed, err := time.Parse(time.RFC3339, startTime)
	if err != nil {
		return fmt.Errorf("invalid start time format: %v", err)
	}
	endTime := startTimeParsed.Add(time.Hour)

	event := &calendar.Event{
		Summary:     summary,
		Description: description,
		Start: &calendar.EventDateTime{
			DateTime: startTime,
			TimeZone: "America/Los_Angeles",
		},
		End: &calendar.EventDateTime{
			DateTime: endTime.Format(time.RFC3339),
			TimeZone: "America/Los_Angeles",
		},
	}

	calendarID := "primary"
	_, err = srv.Events.Insert(calendarID, event).Do()
	if err != nil {
		return fmt.Errorf("unable to create event: %v", err)
	}

	fmt.Printf("Event created: %s\n", event.HtmlLink)
	return nil
}

func createReminder(w http.ResponseWriter, r *http.Request) {
	var todo Todo
	_ = json.NewDecoder(r.Body).Decode(&todo)

	err := addReminderToGoogleCalendar(todo.Title, "Reminder for: "+todo.Title, todo.Reminder)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Reminder added to Google Calendar"))
}

func getTodos(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todos)
}

func createTodo(w http.ResponseWriter, r *http.Request) {
	var todo Todo
	_ = json.NewDecoder(r.Body).Decode(&todo)
	todo.ID = time.Now().String() // Generate ID
	todos = append(todos, todo)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(todo)
}

func updateTodo(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	for index, item := range todos {
		if item.ID == params["id"] {
			todos = append(todos[:index], todos[index+1:]...)
			var todo Todo
			_ = json.NewDecoder(r.Body).Decode(&todo)
			todo.ID = params["id"]
			todos = append(todos, todo)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(todo)
			return
		}
	}
	w.WriteHeader(http.StatusNotFound)
}

func deleteTodo(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	for index, item := range todos {
		if item.ID == params["id"] {
			todos = append(todos[:index], todos[index+1:]...)
			break
		}
	}
	w.WriteHeader(http.StatusNoContent)
}

func main() {
	router := mux.NewRouter()

	// Enable CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
	}).Handler(router)

	// Routes
	router.HandleFunc("/api/todos", getTodos).Methods("GET")
	router.HandleFunc("/api/todos", createTodo).Methods("POST")
	router.HandleFunc("/api/todos/{id}", updateTodo).Methods("PUT")
	router.HandleFunc("/api/todos/{id}", deleteTodo).Methods("DELETE")
	router.HandleFunc("/api/reminder", createReminder).Methods("POST")
	router.HandleFunc("/api/oauth2callback", exchangeCode).Methods("POST")

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000" // Default to port 8000 if not specified in .env
	}
	log.Printf("Server running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}
