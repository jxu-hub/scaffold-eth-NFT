import React, { useState } from "react";
import { Modal, Checkbox, Input, message } from "antd";

const ReportModal = ({ visible, onClose, onSubmit }) => {
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [isCustomReason, setIsCustomReason] = useState(false);
    const [customReason, setCustomReason] = useState("");

    const reportReasons = [
        "涉嫌欺诈",
        "侵权内容",
        "不适当内容",
        "虚假信息",
        "恶意内容",
        "其他原因",
    ];

    const handleReasonChange = (checkedValues) => {
        setSelectedReasons(checkedValues);
        if (checkedValues.includes("其他原因（自定义）")) {
            setIsCustomReason(true);
        } else {
            setIsCustomReason(false);
            setCustomReason(""); // 清空自定义原因
        }
    };

    const handleCustomReasonChange = (e) => {
        setCustomReason(e.target.value);
    };

    const handleSubmit = () => {
        if (selectedReasons.length === 0) {
            message.warning("请选择至少一个举报原因");
            return;
        }

        if (isCustomReason && !customReason.trim()) {
            message.warning("请填写自定义举报信息");
            return;
        }

        // 调用提交举报的回调函数
        onSubmit({ reasons: selectedReasons, customReason: isCustomReason ? customReason : null });
        message.success("举报已提交");
        onClose(); // 关闭模态框
    };

    return (
        <Modal
            title="举报内容"
            visible={visible}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="提交"
            cancelText="取消"
        >
            <div>
                <h3>请选择举报原因：</h3>
                <Checkbox.Group options={reportReasons} onChange={handleReasonChange} />
            </div>
            {isCustomReason && (
                <div style={{ marginTop: "20px" }}>
                    <h3>自定义举报信息：</h3>
                    <Input.TextArea
                        value={customReason}
                        onChange={handleCustomReasonChange}
                        placeholder="请输入自定义举报信息"
                        rows={4}
                    />
                </div>
            )}
        </Modal>
    );
};

export default ReportModal;
