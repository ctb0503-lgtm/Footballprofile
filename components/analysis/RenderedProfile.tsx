import { PPGChartData, SegmentChartData } from "@/types";
import { PpgChart, FiveMinSegmentChart } from "@/components/charts";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface RenderedProfileProps {
  markdownText: string;
  ppgData?: PPGChartData[];
  segmentData?: SegmentChartData[];
}

const RenderedProfileContent = ({ markdown }: { markdown: string }) => {
  if (!markdown) return null;
  return (
    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export const RenderedProfile = ({
  markdownText,
  ppgData,
  segmentData,
}: RenderedProfileProps) => {
  const sections = markdownText.split(/(?=###\s)/);

  return (
    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
      {sections.map((section, index) => {
        const showPpgChart = section
          .trim()
          .startsWith("### 1. Core Performance");
        const showSegmentChart = section
          .trim()
          .startsWith("### 5. First Half Goals");

        return (
          <div key={index}>
            <RenderedProfileContent markdown={section} />
            {showPpgChart && ppgData && ppgData.length > 0 && (
              <PpgChart data={ppgData} />
            )}
            {showSegmentChart && segmentData && segmentData.length > 0 && (
              <FiveMinSegmentChart data={segmentData} />
            )}
          </div>
        );
      })}
    </div>
  );
};
