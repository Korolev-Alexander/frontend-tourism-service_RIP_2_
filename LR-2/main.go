package main

import (
	"html/template"
	"net/http"
	"path/filepath"
	"smartdevices/data"
	"strconv"
	"strings"
)

var (
	tmplDevices      = template.Must(template.ParseFiles("templates/layout.html", "templates/devices.html"))
	tmplDeviceDetail = template.Must(template.ParseFiles("templates/layout.html", "templates/device_detail.html"))
	tmplRequest      = template.Must(template.ParseFiles("templates/layout.html", "templates/request.html"))
)

func main() {
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/devices", http.StatusFound)
			return
		}
		http.NotFound(w, r)
	})

	http.HandleFunc("/devices", devicesHandler)
	http.HandleFunc("/devices/", deviceDetailHandler)
	http.HandleFunc("/request", requestHandler)
	http.HandleFunc("/request/", requestHandler)

	http.ListenAndServe(":8080", nil)
}

func devicesHandler(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	devices := data.Devices
	var filtered []data.Device

	if search != "" {
		for _, d := range devices {
			if strings.Contains(strings.ToLower(d.Name), strings.ToLower(search)) ||
				strings.Contains(strings.ToLower(d.Description), strings.ToLower(search)) {
				filtered = append(filtered, d)
			}
		}
	} else {
		filtered = devices
	}

	tmplDevices.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Devices": filtered,
		"Search":  search,
	})
}

func deviceDetailHandler(w http.ResponseWriter, r *http.Request) {
	idStr := filepath.Base(r.URL.Path)
	id, _ := strconv.Atoi(idStr)
	var device *data.Device

	for _, d := range data.Devices {
		if d.ID == id {
			device = &d
			break
		}
	}

	if device == nil {
		http.NotFound(w, r)
		return
	}

	tmplDeviceDetail.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Device": device,
	})
}

func requestHandler(w http.ResponseWriter, r *http.Request) {
	tmplRequest.ExecuteTemplate(w, "layout.html", map[string]interface{}{
		"Request": data.CurrentRequest,
		"Devices": data.Devices,
	})
}
