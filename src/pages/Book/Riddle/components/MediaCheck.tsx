import { Riddle } from "./RiddleForm";

export interface MediaCheckProps {
  riddleData: Riddle;
  inputValue: string;
  inputLabel: string;
}

const MediaCheck = ({
  riddleData,
  inputLabel,
  inputValue,
}: MediaCheckProps) => {
  return (
    <>
      {riddleData[inputValue + "Type"] && (
        <>
          <div>
            {inputLabel} type: {riddleData[inputValue + "Type"]}
          </div>
          <div>
            {inputLabel} text: {riddleData[inputValue + "Text"]}
          </div>

          {riddleData[inputValue + "Type"] !== "text" && (
            <>
              <div>{inputLabel} media: (media here)</div>
              {riddleData[inputValue + "Media"] &&
                riddleData[inputValue + "Type"] === "image" && (
                  <div>
                    <label htmlFor="step" className="font-bold text-gray-600">
                      Current {inputLabel} Image
                    </label>
                    <img src={riddleData[inputValue + "Media"]} />
                  </div>
                )}
              {riddleData[inputValue + "Media"] &&
                riddleData[inputValue + "Type"] === "video" && (
                  <div>
                    <label htmlFor="step" className="font-bold text-gray-600">
                      Current {inputLabel} Video
                    </label>
                    <video src={riddleData[inputValue + "Media"]} controls />
                  </div>
                )}
              {riddleData[inputValue + "Media"] &&
                riddleData[inputValue + "Type"] === "sound" && (
                  <div>
                    <label htmlFor="step" className="font-bold text-gray-600">
                      Current {inputLabel} Audio
                    </label>
                    <audio src={riddleData[inputValue + "Media"]} controls />
                  </div>
                )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default MediaCheck;
