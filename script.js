const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

const harmonicsCanvas = document.getElementById('harmonicsCanvas');
const harmonicsCtx = harmonicsCanvas.getContext('2d');

const alInput = document.getElementById('al');
const blInput = document.getElementById('bl');
const ngInput = document.getElementById('ng');
const neInput = document.getElementById('ne');
const plotButton = document.getElementById('plotButton');

plotButton.addEventListener('click', () => {
  const al = parseFloat(alInput.value);
  const bl = parseFloat(blInput.value);
  const ng = parseInt(ngInput.value);
  const ne = parseInt(neInput.value);

  // Debug: Log input values
  console.log('al:', al, 'bl:', bl, 'ng:', ng, 'ne:', ne);

  if (isNaN(al) || isNaN(bl) || isNaN(ng) || isNaN(ne)) {
    alert('Please enter valid numbers.');
    return;
  }

  if (ne < 1 || ne > 1000) {
    alert('Ne must be between 1 and 1000.');
    return;
  }

  // Clear canvases
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  harmonicsCtx.clearRect(0, 0, harmonicsCanvas.width, harmonicsCanvas.height);

  // Tabulate the function
  const { Xe, Ye } = tabulateFunction(al, bl, ne);

  // Debug: Log tabulated values
  console.log('Xe:', Xe);
  console.log('Ye:', Ye);

  // Calculate Fourier series
  const Yg = calculateFourierSeries(Xe, Ye, ne, ng);

  // Debug: Log Fourier series values
  console.log('Yg:', Yg);

  // Plot the graphs
  plotGraphs(Xe, Ye, Yg, ne);

  // Ask the user if they want to see harmonics
  const showHarmonics = confirm('Do you want to see the harmonics?');
  if (showHarmonics) {
    plotHarmonics(ng, Yg);
  }
});

function tabulateFunction(al, bl, ne) {
  const Xe = [];
  const Ye = [];
  const h = (bl - al) / ne;

  for (let i = 0; i < ne; i++) {
    Xe[i] = al + i * h;
    Ye[i] = f(Xe[i]);
  }

  return { Xe, Ye };
}

function f(x) {
  const Tp = blInput.value - alInput.value;
  if (x < Tp / 2) return 2;
  if (x >= Tp / 2 && x < (3 * Tp) / 4) return (4 * (Tp - 2 * x)) / Tp;
  return (8 * (x - Tp)) / Tp;
}

function calculateFourierSeries(Xe, Ye, ne, ng) {
  const Yg = new Array(ne).fill(0);
  const Tp = blInput.value - alInput.value;
  const w = (2 * Math.PI) / Tp;

  const a = new Array(ng + 1).fill(0);
  const b = new Array(ng + 1).fill(0);
  const c = new Array(ng + 1).fill(0);

  // Calculate Fourier coefficients
  for (let k = 1; k <= ng; k++) {
    let G = 0;
    let D = 0;
    const KOM = k * w;

    for (let i = 0; i < ne; i++) {
      const S = KOM * Xe[i];
      G += Ye[i] * Math.cos(S);
      D += Ye[i] * Math.sin(S);
    }

    a[k] = (2 * G) / ne;
    b[k] = (2 * D) / ne;
    c[k] = Math.sqrt(a[k] ** 2 + b[k] ** 2);
  }

  // Calculate a0
  a[0] = Ye.reduce((sum, y) => sum + y, 0) / ne;

  // Calculate Yg (Fourier series approximation)
  for (let i = 0; i < ne; i++) {
    let S = 0;
    const D = Xe[i] * w;

    for (let k = 1; k <= ng; k++) {
      const KOM = k * D;
      S += b[k] * Math.sin(KOM) + a[k] * Math.cos(KOM);
    }

    Yg[i] = a[0] + S;
  }

  return Yg;
}

function plotGraphs(Xe, Ye, Yg, ne) {
  const margin = 40;
  const width = graphCanvas.width - 2 * margin;
  const height = graphCanvas.height - 2 * margin;

  // Find min and max values for scaling
  const minX = Math.min(...Xe);
  const maxX = Math.max(...Xe);
  const minY = Math.min(...Ye, ...Yg);
  const maxY = Math.max(...Ye, ...Yg);

  // Debug: Log min and max values
  console.log('minX:', minX, 'maxX:', maxX, 'minY:', minY, 'maxY:', maxY);

  // Scaling factors
  const kx = width / (maxX - minX);
  const ky = height / (maxY - minY);
  const zx = (width * minX - margin * (minX + maxX)) / (minX - maxX);
  const zy = (height * maxY - margin * (minY + maxY)) / (maxY - minY);

  // Draw grid
  graphCtx.strokeStyle = '#ddd'; // Light gray grid lines
  graphCtx.lineWidth = 1;
  const numGridLinesX = 10; // Number of vertical grid lines
  const numGridLinesY = 10; // Number of horizontal grid lines

  // Vertical grid lines
  for (let i = 0; i <= numGridLinesX; i++) {
    const x = margin + (i * width) / numGridLinesX;
    graphCtx.beginPath();
    graphCtx.moveTo(x, margin);
    graphCtx.lineTo(x, margin + height);
    graphCtx.stroke();
  }

  // Horizontal grid lines
  for (let i = 0; i <= numGridLinesY; i++) {
    const y = margin + (i * height) / numGridLinesY;
    graphCtx.beginPath();
    graphCtx.moveTo(margin, y);
    graphCtx.lineTo(margin + width, y);
    graphCtx.stroke();
  }

  // Draw axes
  graphCtx.strokeStyle = '#000'; // Black axes
  graphCtx.lineWidth = 2;
  graphCtx.beginPath();
  graphCtx.moveTo(margin, margin + height);
  graphCtx.lineTo(margin + width, margin + height); // X-axis
  graphCtx.moveTo(margin, margin);
  graphCtx.lineTo(margin, margin + height); // Y-axis
  graphCtx.stroke();

  // Label axes
  graphCtx.fillStyle = '#000';
  graphCtx.font = '12px Arial';
  graphCtx.textAlign = 'center';
  graphCtx.textBaseline = 'top';

  // X-axis labels
  for (let i = 0; i <= numGridLinesX; i++) {
    const x = margin + (i * width) / numGridLinesX;
    const xValue = minX + (i * (maxX - minX)) / numGridLinesX;
    graphCtx.fillText(xValue.toFixed(2), x, margin + height + 5);
  }

  // Y-axis labels
  graphCtx.textAlign = 'right';
  graphCtx.textBaseline = 'middle';
  for (let i = 0; i <= numGridLinesY; i++) {
    const y = margin + (i * height) / numGridLinesY;
    const yValue = maxY - (i * (maxY - minY)) / numGridLinesY;
    graphCtx.fillText(yValue.toFixed(2), margin - 5, y);
  }

  // Plot original function
  graphCtx.strokeStyle = '#f00'; // Red for original function
  graphCtx.lineWidth = 2;
  graphCtx.beginPath();
  graphCtx.moveTo(margin + (Xe[0] - minX) * kx, margin + height - (Ye[0] - minY) * ky);
  for (let i = 1; i < ne; i++) {
    graphCtx.lineTo(margin + (Xe[i] - minX) * kx, margin + height - (Ye[i] - minY) * ky);
  }
  graphCtx.stroke();

  // Plot Fourier series approximation
  graphCtx.strokeStyle = '#00f'; // Blue for Fourier series
  graphCtx.lineWidth = 2;
  graphCtx.beginPath();
  graphCtx.moveTo(margin + (Xe[0] - minX) * kx, margin + height - (Yg[0] - minY) * ky);
  for (let i = 1; i < ne; i++) {
    graphCtx.lineTo(margin + (Xe[i] - minX) * kx, margin + height - (Yg[i] - minY) * ky);
  }
  graphCtx.stroke();
}

function plotHarmonics(ng, Yg) {
  const margin = 40;
  const width = harmonicsCanvas.width - 2 * margin;
  const height = harmonicsCanvas.height - 2 * margin;

  // Clear harmonics canvas
  harmonicsCtx.clearRect(0, 0, harmonicsCanvas.width, harmonicsCanvas.height);

  // Draw grid
  harmonicsCtx.strokeStyle = '#ddd'; // Light gray grid lines
  harmonicsCtx.lineWidth = 1;
  const numGridLinesX = ng; // Number of vertical grid lines (equal to number of harmonics)
  const numGridLinesY = 5; // Number of horizontal grid lines

  // Vertical grid lines
  for (let i = 0; i <= numGridLinesX; i++) {
    const x = margin + (i * width) / numGridLinesX;
    harmonicsCtx.beginPath();
    harmonicsCtx.moveTo(x, margin);
    harmonicsCtx.lineTo(x, margin + height);
    harmonicsCtx.stroke();
  }

  // Horizontal grid lines
  for (let i = 0; i <= numGridLinesY; i++) {
    const y = margin + (i * height) / numGridLinesY;
    harmonicsCtx.beginPath();
    harmonicsCtx.moveTo(margin, y);
    harmonicsCtx.lineTo(margin + width, y);
    harmonicsCtx.stroke();
  }

  // Draw axes
  harmonicsCtx.strokeStyle = '#000'; // Black axes
  harmonicsCtx.lineWidth = 2;
  harmonicsCtx.beginPath();
  harmonicsCtx.moveTo(margin, margin + height);
  harmonicsCtx.lineTo(margin + width, margin + height); // X-axis
  harmonicsCtx.moveTo(margin, margin);
  harmonicsCtx.lineTo(margin, margin + height); // Y-axis
  harmonicsCtx.stroke();

  // Label axes
  harmonicsCtx.fillStyle = '#000';
  harmonicsCtx.font = '12px Arial';
  harmonicsCtx.textAlign = 'center';
  harmonicsCtx.textBaseline = 'top';

  // X-axis labels (harmonic numbers)
  for (let i = 1; i <= ng; i++) {
    const x = margin + (i * width) / ng;
    harmonicsCtx.fillText(`C${i}`, x, margin + height + 15);
  }

  // Y-axis labels (amplitude values)
  harmonicsCtx.textAlign = 'right';
  harmonicsCtx.textBaseline = 'middle';
  const maxC = Math.max(...Yg);
  for (let i = 0; i <= numGridLinesY; i++) {
    const y = margin + (i * height) / numGridLinesY;
    const yValue = maxC - (i * maxC) / numGridLinesY;
    harmonicsCtx.fillText(yValue.toFixed(2), margin - 5, y);
  }

  // Draw harmonics (vertical lines)
  harmonicsCtx.strokeStyle = '#0f0'; // Green for harmonics
  harmonicsCtx.lineWidth = 2;
  const krokx = width / ng;

  for (let i = 1; i <= ng; i++) {
    const x = margin + i * krokx;
    const y = margin + height - Yg[i] * (height / maxC);

    harmonicsCtx.beginPath();
    harmonicsCtx.moveTo(x, margin + height);
    harmonicsCtx.lineTo(x, y);
    harmonicsCtx.stroke();

    // Label the harmonics (optional)
    harmonicsCtx.fillStyle = '#000';
    harmonicsCtx.fillText(`C${i}`, x - 10, margin + height + 15);
  }
}