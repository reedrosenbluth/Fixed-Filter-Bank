import { useEffect, useState, useRef } from "react";

const SpectrumAnalyzer = ({
  fftData,
  sampleRate,
  frequencyIntervals,
  filterFreqs,
  amps,
}) => {
  const canvasRef = useRef(null);
  const lastFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.textRendering = "geometricPrecision";
    ctx.imageSmoothingEnabled = true;

    const drawSpectrum = (fftData) => {
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / (frequencyIntervals.length - 1);

      if (!lastFrameRef.current) {
        lastFrameRef.current = ctx.getImageData(0, 0, width, height);
      }

      ctx.putImageData(lastFrameRef.current, 0, 0);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#A0A0A0";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < frequencyIntervals.length - 1; i++) {
        const startFreq = frequencyIntervals[i];
        const endFreq = frequencyIntervals[i + 1];
        const startIndex = Math.floor(
          (startFreq / (sampleRate / 2)) * fftData.length
        );
        const endIndex = Math.floor(
          (endFreq / (sampleRate / 2)) * fftData.length
        );

        for (let j = startIndex; j <= endIndex; j++) {
          const magnitude = fftData[j];
          const logMagnitude = Math.log10(magnitude + 1);
          const y = height - (logMagnitude / 6) * height * 2;

          const progress = (j - startIndex) / (endIndex - startIndex);
          const x = i * barWidth + progress * barWidth;

          ctx.lineTo(x, y);
        }
      }

      ctx.lineTo(width, height);
      ctx.stroke();

      lastFrameRef.current = ctx.getImageData(0, 0, width, height);
    };

    const drawFrequencyLabels = () => {
      const width = canvas.width - 80;
      const height = canvas.height;
      const labelWidth = width / (frequencyIntervals.length - 1);

      ctx.fillStyle = "white";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (let i = 0; i < frequencyIntervals.length; i++) {
        const labelText = `${frequencyIntervals[i]} Hz`;
        const labelX = i * labelWidth + 30;
        const labelY = height - 20;

        ctx.fillText(labelText, labelX, labelY);
      }
    };

    const drawFilterLines = () => {
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / (frequencyIntervals.length - 1);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;

      for (let i = 0; i < filterFreqs.length; i++) {
        const filterFreq = filterFreqs[i];
        const amp = amps[i];

        const filterIndex = frequencyIntervals.findIndex(
          (freq) => freq >= filterFreq
        );

        if (filterIndex !== -1) {
          const x = filterIndex * barWidth;
          const y = height - amp * height;

          ctx.beginPath();
          ctx.moveTo(x, height);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    };

    drawSpectrum(fftData);
    drawFilterLines();
    drawFrequencyLabels();
  }, [fftData, sampleRate, frequencyIntervals, filterFreqs, amps]);

  return (
    <div style={{ width: "1000px", height: "500px" }}>
      <canvas
        ref={canvasRef}
        width="2000"
        height="1000"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default function View({ patchConnection }) {
  const [stateLoaded, setStateLoaded] = useState(false);
  const [fftData, setFFTData] = useState([]);
  const frequencyIntervals = [
    0, 20, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 10000,
  ];

  const filterFreqs = [50, 100, 200, 500, 1000, 2000, 3000, 5000];
  const [amps, setAmps] = useState([0, 0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const handleDftOut = (event) => {
      setFFTData(event.magnitudes);
    };

    const handleAmpChange = (event) => {
      const id = event.endpointID;
      const val = event.value;
      const index = parseInt(id.slice(-1));

      if (id.slice(0, 3) === "amp") {
        setAmps((prevAmps) => {
          const newAmps = [...prevAmps];
          newAmps[index] = val;
          return newAmps;
        });
      }
    };

    if (patchConnection !== undefined) {
      patchConnection.addEndpointListener("dftOut", handleDftOut);
      patchConnection.addAllParameterListener(handleAmpChange);

      if (!stateLoaded) {
        patchConnection.requestParameterValue("ampBand0");
        patchConnection.requestParameterValue("ampBand1");
        patchConnection.requestParameterValue("ampBand2");
        patchConnection.requestParameterValue("ampBand3");
        patchConnection.requestParameterValue("ampBand4");
        patchConnection.requestParameterValue("ampBand5");
        patchConnection.requestParameterValue("ampBand6");
        patchConnection.requestParameterValue("ampBand7");
        setStateLoaded(true);
      }
    }

    return () => {
      patchConnection.removeEndpointListener("dftOut", handleDftOut);
      patchConnection.removeAllParameterListener(handleAmpChange);
    };
  }, [patchConnection, stateLoaded]);

  const style = {
    height: "500px",
    width: "1000px",
    background: "white",
  };

  return (
    <div style={style}>
      <SpectrumAnalyzer
        fftData={fftData}
        sampleRate={44100}
        frequencyIntervals={frequencyIntervals}
        filterFreqs={filterFreqs}
        amps={amps}
      />
    </div>
  );
}
