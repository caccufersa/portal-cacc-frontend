'use client';

import React from 'react';
import s from '../News.module.css';

export function SkeletonItem() {
    return (
        <div className={s.skeletonItem}>
            <div className={s.skeletonThumb} />
            <div className={s.skeletonLines}>
                <div className={s.skeletonLineMed} />
                <div className={s.skeletonLineLong} />
                <div className={s.skeletonLineTiny} />
            </div>
        </div>
    );
}

export function ListSkeleton() {
    return (
        <>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
        </>
    );
}
