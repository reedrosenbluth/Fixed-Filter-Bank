import { useEffect, useState, useRef } from "react";
import "./index.css";

const SpectrumAnalyzer = ({
  fftData,
  sampleRate,
  frequencyIntervals,
  filterFreqs,
  amps,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawSpectrum = (fftData) => {
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / (frequencyIntervals.length - 1);

      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#A0A0A0";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(0, height);

      frequencyIntervals.slice(0, -1).forEach((startFreq, i) => {
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
      });

      ctx.lineTo(width, height);
      ctx.stroke();
    };

    const drawFrequencyLabels = () => {
      const width = canvas.width - 80;
      const height = canvas.height;
      const labelWidth = width / (frequencyIntervals.length - 1);

      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      frequencyIntervals.forEach((freq, i) => {
        const labelX = i * labelWidth + 30;
        ctx.fillText(freq, labelX, height - 30);
      });
    };

    drawSpectrum(fftData);
    drawFrequencyLabels();
  }, [fftData, sampleRate, frequencyIntervals, filterFreqs, amps]);

  return (
    <div>
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
    0, 29, 61, 115, 218, 411, 777, 1500, 2800, 5200, 11000,
  ];
  const filterFreqs = [61, 115, 218, 411, 777, 1500, 2800, 5200];

  const [amps, setAmps] = useState(Array(8).fill(0.0));
  const [pans, setPans] = useState(Array(8).fill(0.0));

  useEffect(() => {
    const handleDftOut = (event) => {
      setFFTData(event.magnitudes);
    };

    const handleControlChange = (event) => {
      const id = event.endpointID;
      const val = event.value;
      const index = parseInt(id.slice(-1));

      if (id.slice(0, 3) === "amp") {
        setAmps((prevAmps) => {
          const newAmps = [...prevAmps];
          newAmps[index] = val;
          return newAmps;
        });
      } else if (id.slice(0, 3) === "pan") {
        setPans((prevPans) => {
          const newPans = [...prevPans];
          newPans[index] = val;
          return newPans;
        });
      }
    };

    patchConnection?.addEndpointListener("dftOut", handleDftOut);
    patchConnection?.addAllParameterListener(handleControlChange);

    if (!stateLoaded) {
      patchConnection?.requestParameterValue("ampBand0");
      patchConnection?.requestParameterValue("ampBand1");
      patchConnection?.requestParameterValue("ampBand2");
      patchConnection?.requestParameterValue("ampBand3");
      patchConnection?.requestParameterValue("ampBand4");
      patchConnection?.requestParameterValue("ampBand5");
      patchConnection?.requestParameterValue("ampBand6");
      patchConnection?.requestParameterValue("ampBand7");

      patchConnection?.requestParameterValue("panBand0");
      patchConnection?.requestParameterValue("panBand1");
      patchConnection?.requestParameterValue("panBand2");
      patchConnection?.requestParameterValue("panBand3");
      patchConnection?.requestParameterValue("panBand4");
      patchConnection?.requestParameterValue("panBand5");
      patchConnection?.requestParameterValue("panBand6");
      patchConnection?.requestParameterValue("panBand7");

      setStateLoaded(true);
    }

    return () => {
      patchConnection?.removeEndpointListener("dftOut", handleDftOut);
      patchConnection?.removeAllParameterListener(handleControlChange);
    };
  }, [patchConnection, stateLoaded]);

  const containerStyle = {
    height: "500px",
    width: "1000px",
    background: "white",
  };

  return (
    <div style={containerStyle}>
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
        }}
      >
        <SpectrumAnalyzer
          fftData={fftData}
          sampleRate={44100}
          frequencyIntervals={frequencyIntervals}
          filterFreqs={filterFreqs}
          amps={amps}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <div>
          {amps.map((amp, i) => (
            <div
              style={{
                position: "relative",
                left: `${(i / amps.length) * 76.8 + 21.75}%`,
              }}
            >
              <input
                className="freq-slider"
                type="range"
                value={amp}
                min={0.0}
                max={1.0}
                step={0.001}
                onChange={(e) => {
                  const newAmps = [...amps];
                  newAmps[i] = e.target.value;
                  setAmps(newAmps);
                  patchConnection?.sendEventOrValue(
                    `ampBand${i}`,
                    e.target.value,
                    100
                  );
                }}
              />
              <input
                className="pan-slider"
                type="range"
                min={-1.0}
                max={1.0}
                step={0.001}
                value={pans[i]}
                onChange={(e) => {
                  const newPans = [...pans];
                  newPans[i] = e.target.value;
                  setPans(newPans);
                  patchConnection?.sendEventOrValue(
                    `panBand${i}`,
                    e.target.value,
                    100
                  );
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
