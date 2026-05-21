import { Button, Space, message } from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import type { DashboardStats, RiskAssessment, TrendDataPoint, PopulationStat } from '../../services/api';

interface Props {
  stats: DashboardStats;
  assessments: RiskAssessment[];
  trends: TrendDataPoint[];
  popStats: PopulationStat[];
}

export default function ExportButtons({ stats, assessments, trends, popStats }: Props) {
  const exportExcel = () => {
    const ws1 = XLSX.utils.json_to_sheet(assessments.map(a => ({
      '区域': a.zone_name,
      '灾害类型': a.disaster_type,
      '风险等级': a.risk_level,
      '风险评分': a.risk_score,
      '影响人口': a.population_total,
      '预估损失(万元)': a.estimated_loss,
    })));

    const ws2 = XLSX.utils.json_to_sheet(trends.map(t => ({
      '日期': t.date,
      '平均风险评分': t.avg_risk_score,
      '预警数量': t.alert_count,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, '风险评估');
    XLSX.utils.book_append_sheet(wb, ws2, '趋势数据');
    XLSX.writeFile(wb, `风险评估报告_${new Date().toISOString().slice(0, 10)}.xlsx`);
    message.success('Excel 导出成功');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const th = 7;

    doc.setFontSize(16);
    doc.setTextColor(24, 144, 255);
    doc.text('险析 · 灾害风险评估报告', 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(`生成时间: ${new Date().toLocaleString()}`, 14, 23);

    let y = 32;
    doc.setFontSize(12);
    doc.setTextColor(232, 232, 232);
    doc.text('总体概况', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    const overview = [
      `区域人口: ${stats.total_population.toLocaleString()}人`,
      `预警总数: ${stats.total_alerts}次  |  活跃灾害: ${stats.active_disasters}个  |  在线服务器: ${stats.online_servers}/${stats.total_servers}`,
      `平均人口密度: ${stats.avg_population_density.toFixed(0)}人/km²  |  预估总损失: ${stats.estimated_total_loss.toFixed(1)}万元`,
    ];
    overview.forEach(line => { doc.text(line, 14, y); y += 5; });

    y += 4;
    doc.setFontSize(12);
    doc.setTextColor(232, 232, 232);
    doc.text('风险评估明细', 14, y);
    y += 6;

    const headers = ['区域', '灾害类型', '风险等级', '评分', '人口', '损失(万)'];
    const colW = [40, 22, 18, 16, 20, 22];
    doc.setFontSize(8);
    headers.forEach((h, i) => {
      doc.setTextColor(140, 140, 140);
      doc.text(h, 14 + colW.slice(0, i).reduce((a: number, b: number) => a + b, 0), y);
    });
    y += 5;

    doc.setTextColor(200, 200, 200);
    assessments.slice(0, 15).forEach(row => {
      const fields = [row.zone_name, row.disaster_type, row.risk_level, String(row.risk_score), String(row.population_total), String(row.estimated_loss)];
      fields.forEach((f, i) => {
        doc.text(String(f).substring(0, 16), 14 + colW.slice(0, i).reduce((a: number, b: number) => a + b, 0), y);
      });
      y += th;
      if (y > 270) { doc.addPage(); y = 14; }
    });

    doc.save(`风险评估报告_${new Date().toISOString().slice(0, 10)}.pdf`);
    message.success('PDF 导出成功');
  };

  return (
    <Space>
      <Button icon={<FileExcelOutlined />} onClick={exportExcel} style={{ borderRadius: 6 }}>
        Excel
      </Button>
      <Button icon={<FilePdfOutlined />} onClick={exportPDF} style={{ borderRadius: 6 }}>
        PDF
      </Button>
    </Space>
  );
}
