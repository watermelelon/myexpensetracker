import Amplify from 'aws-amplify';
import awsconfig from './aws-exports.js'; // Ensure Amplify is configured
import { Storage } from '@aws-amplify/storage';

Amplify.configure(awsconfig); // Initialize Amplify

const fileInput = document.getElementById('fileInput');
const tableBody = document.querySelector('#expenseTable tbody');
const ctx = document.getElementById('expenseChart').getContext('2d');
let chart;

const data = [];

// Function to add a new entry dynamically
async function addEntry(file) {
    try {
        // Upload file to S3 using Amplify
        const fileKey = `receipts/${file.name}`;
        await Storage.put(fileKey, file, {
            contentType: file.type,
        });

        console.log(`File uploaded successfully: ${fileKey}`);

        // Call your backend (optional) to process the receipt and fetch vendor/total
        const { vendor, total } = await fetchReceiptDetails(fileKey);

        // Update table and chart with real data
        data.push({ vendor: vendor || 'Unknown Vendor', price: total || 0 });
        updateTable();
        updateChart();
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}


// Function to fetch receipt details from backend
async function fetchReceiptDetails(fileKey) {
    try {
        const apiUrl = 'https://4rz5bax45h.execute-api.us-east-1.amazonaws.com'; // Replace with your API Gateway URL
        const response = await fetch(`${apiUrl}?fileKey=${encodeURIComponent(fileKey)}`);
        const result = await response.json();
        console.log('Receipt details:', result);

        return {
            vendor: result.vendor,
            total: parseFloat(result.total),
        };
    } catch (error) {
        console.error('Error fetching receipt details:', error);
        return { vendor: 'Unknown', total: 0 };
    }
}



// Function to update the table dynamically
function updateTable() {
    tableBody.innerHTML = ''; // Clear the table body
    data.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.vendor}</td>
            <td>${entry.price.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to update the chart dynamically
function updateChart() {
    const labels = data.map(entry => entry.vendor);
    const values = data.map(entry => entry.price);

    if (chart) chart.destroy(); // Destroy existing chart before updating

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            }],
        },
    });
}

// Simulate uploading files
fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    for (let file of files) {
        // For demo purposes, adding fake data
        const vendor = `Vendor ${Math.floor(Math.random() * 100)}`;
        const price = Math.random() * 100;
        addEntry(vendor, price);
    }
});

// Add drag-and-drop functionality
const dropArea = document.getElementById('drop-area');
dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('dragging');
});
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragging'));
dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dropArea.classList.remove('dragging');
    const files = event.dataTransfer.files;
    for (let file of files) {
        const vendor = `Vendor ${Math.floor(Math.random() * 100)}`;
        const price = Math.random() * 100;
        addEntry(vendor, price);
    }
});
