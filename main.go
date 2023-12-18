package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var DBXHOST string = os.Getenv("DBXHOST")
var DBXPAT string = os.Getenv("DBXPAT")

type wrappedJson struct {
	Url          string `json:"url"`
	Method       string `json:"method"`
	Catalog_Name string `json:"catalog_name,omitempty"`
	Schema_Name  string `json:"schema_name,omitempty"`
	Table_Name   string `json:"table_name,omitempty"`
}

func apiWrapper(c *gin.Context) {

	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

	var requestBody wrappedJson

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	endPoint := requestBody.Url
	method := requestBody.Method

	fmt.Println(endPoint)

	url := fmt.Sprintf("%s%s", DBXHOST, endPoint)

	if requestBody.Catalog_Name != "" {
		url = fmt.Sprintf("%s?catalog_name=%s", url, requestBody.Catalog_Name)
	}

	if requestBody.Schema_Name != "" {
		url = fmt.Sprintf("%s&schema_name=%s", url, requestBody.Schema_Name)
	}

	if requestBody.Table_Name != "" {
		url = fmt.Sprintf("%s&table_name=%s", url, requestBody.Table_Name)
	}

	fmt.Println(url)

	client := &http.Client{}

	req, err := http.NewRequest(method, url, nil)

	if err != nil {
		fmt.Println(err)
		return
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", DBXPAT))

	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	fmt.Sprintln(body)
	if err != nil {
		fmt.Println(err)
		return
	}

	c.Data(http.StatusOK, "application/json", body)
}

func main() {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		// AllowOrigins:     []string{"*"},                                                                     // Allows all origins
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},                      // Include all methods you expect to use
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}, // Common headers
		ExposeHeaders:    []string{"Content-Length"},                                                        // Headers that are safe to expose
		AllowCredentials: true,                                                                              // Whether to allow cookies, authorization headers, etc.
		MaxAge:           12 * time.Hour,                                                                    // Maximum age for the CORS options to be cached
	}))

	router.POST("/api/", apiWrapper)

	router.POST("/api/test", testRoute)

	router.Run(":8080")
}

func testRoute(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Test successful"})
}
