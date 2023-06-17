'use strict'

// Chart library for plotting the data
import Chart from 'chart.js/auto'
// Zoom plugin for zooming into the data
import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin)

// Initialize variables
let time

function addData(chart, label, data, dataset=0) {
  if (!chart.data.labels.includes(label)) {
    chart.data.labels.push(label)
  }
  chart.data.datasets[dataset].data.push(data)
  chart.update('none')
}

function resetChart(chart) {
  chart.data.labels = []
  chart.data.datasets.forEach((dataset) => {
      dataset.data = []
  })
  chart.update('none')
}

const tempChart = new Chart(
  document.getElementById('tempGraph'),
  {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temperature',
          tension: 0.2
        },
        {
          label: 'Set point',
          pointRadius: 0 
        }
      ]
    }, 
    options: {
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time (Sec)',
            font: {
              size: 20,
              weight: 'bold',
              lineHeight: 1.2,
            },
            padding: {top: 20, left: 0, right: 0, bottom: 0}
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Temperature (C)',
            font: {
              size: 20,
              weight: 'bold',
              lineHeight: 1.2,
            },
            padding: {top: 20, left: 0, right: 0, bottom: 0}
          }
        }
      },
      plugins: {
        zoom: {
          pan:{
            enabled: true
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
          },
          limits: {
            y: {min: 0, max: 100}
          }
        }
      }
    }
  }
);

document.getElementById("resetTemp").addEventListener("click", ()=>{tempChart.resetZoom()})

const PIDChart = new Chart(
  document.getElementById('PIDGraph'),
  {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'PWM'
        }
      ]
    }, 
    options: {
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time (Sec)',
            font: {
              size: 20,
              weight: 'bold',
              lineHeight: 1.2,
            },
            padding: {top: 20, left: 0, right: 0, bottom: 0}
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Power',
            font: {
              size: 20,
              weight: 'bold',
              lineHeight: 1.2,
            },
            padding: {top: 20, left: 0, right: 0, bottom: 0}
          }
        }
      },
      maintainAspectRatio: true,
      plugins: {
        zoom: {
          pan:{
            enabled: true
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
          },
          limits: {
            y: {min: 0, max: 100}
          }
        }
      }
    }
  }
);

document.getElementById("resetTemp").addEventListener("click", ()=>{tempChart.resetZoom()})
document.getElementById("resetPID").addEventListener("click", ()=>{PIDChart.resetZoom()})

document.getElementById("setPointSubmit").addEventListener("click", ()=>{
  webSocket.send(JSON.stringify({reset: true}))
  resetChart(tempChart)
  resetChart(PIDChart)
  setPoint = document.getElementById("setPointEntry").value
})

// Establish the WS connection on 8080
// Do NOT use the port that the WS is using for anything else, it WILL cause issues
const webSocket = new WebSocket('ws://localhost:8080')

// Send a test ping to the WSS
webSocket.onopen = () => {
  webSocket.send(JSON.stringify({reset: true}))
}

// When the client recieves a message...
webSocket.onmessage = (message) => {

  // Parse it as JSON
  message = JSON.parse(message.data)
  // Check there are no errors (this *will* break the code go figure)
  if (typeof message.error !== "undefined"){
    throw (`error: ${message.error}`)
  }
  console.log(message)
  time = message.time
  if (!(setPoint === undefined)){
    addData(tempChart, time, message.temp, 0)
    addData(tempChart, time, setPoint, 1)
    addData(PIDChart, time, message.PWM)
  }
}