import { marked } from 'marked';
import { PPGChartData, SegmentChartData } from '@/types';
import { PpgChart, FiveMinSegmentChart } from '@/components/charts';

interface RenderedProfileProps {
  markdownText: string;
  ppgData?: PPGChartData[];
  segmentData?: SegmentChartData[];
}

const RenderedProfileContent = ({ markdown }: { markdown: string }) => {
  if (!markdown) return null;
  try {
    const html = marked.parse(markdown);
    return <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    console.error("Error parsing markdown:", e, markdown);
    return <pre>Error rendering content.</pre>;
  }
};

export const RenderedProfile = ({
  markdownText,
  ppgData,
  segmentData
}: RenderedProfileProps) => {
  const sections = markdownText.split(/(?=###\s)/);

  return (
    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
      {sections.map((section, index) => {
        const showPpgChart = section.trim().startsWith('### 1. Core Performance');
        const showSegmentChart = section.trim().startsWith('### 5. First Half Goals');

        return (
          <div key={index}>
            <RenderedProfileContent markdown={section} />
            {showPpgChart && ppgData && ppgData.length > 0 && <PpgChart data={ppgData} />}
            {showSegmentChart && segmentData && segmentData.length > 0 && <FiveMinSegmentChart data={segmentData} />}
          </div>
        );
      })}
    </div>
  );
};
