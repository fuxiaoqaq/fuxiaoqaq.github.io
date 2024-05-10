---
title: Map
---

:::danger 注意JDK版本
#### 源代码基于JDK17
:::

## HashMap
### 源码分析

```java

public class HashMap<K,V> extends AbstractMap<K,V>
        implements Map<K,V>, Cloneable, Serializable {
    // 默认的数组初始化容量为16，这个容量只能以2的指数倍进行扩容操作
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16  
    // 数组最大容量  
    static final int MAXIMUM_CAPACITY = 1 << 30;
    // 默认的负载因子值为0.75  
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
    // 桶的树化阈值，如果一个桶(单向链表)中的节点数量大于该值，则需要将该桶转换成红黑树 
    // 该值至少为8  
    // 是否需要进行树化，需要依据MIN_TREEIFY_CAPACITY常量的值进行判定  
    static final int TREEIFY_THRESHOLD = 8;
    // 桶的反树化阈值，如果一个桶中的红黑树节点数量小于该值，则需要将该桶从红黑树重新转换为链表  
    static final int UNTREEIFY_THRESHOLD = 6;
    // 当集合中的K-V键值对节点过多时，是进行树化操作还是进行扩容操作呢?  
    // 针对这个问题，HashMap 集合使用 MIN_TREEIFY_CAPACITY 常量进行控制  
    // 只有当集合中K-V键值对节点数大于该值，  
    // 并且某个桶中的K-V键值对节点数大于TREEIFY_THRESHOLD的值时，该桶才会进行树化操作  
    static final int MIN_TREEIFY_CAPACITY = 64;

    // 使用该变量记录HashMap集合的数组结构  
    // 数组可以扩容，甚至在进行某些操作时允许数组的长度为0
    transient Node<K,V>[] table;

    // 该Set集合存储了当前集合中所有K-V键值对节点的引用  
    // 可以将该Set集合理解为缓存方案，它不在意每个K-V键值对节点的真实存储位置，  
    // 还可以有效减少HashMap集合的编码工作量  
    transient Set<Map.Entry<K,V>> entrySet;

    // 记录当前K-V键值对节点的数量  
    transient int size;

    // 记录该集合在初始化后进行写操作的次数  
    transient int modCount;

    // table 数组下一次进行扩容操作的门槛，这个门槛值=当前集合容量值 * loadFactor  
    int threshold;

    // 设置的负载因子，默认为DEFAULT_LOAD_FACTOR，可以设置该值大于1  
    final float loadFactor;

    /*
     * HashMap 集合使用 HashMap.Node 类的对象构建单向链表(中的每一个节点)，
     * 以HashMap 集合中数组(前面提到的HashMap集合中table变量所代表的数组)中的每一个
     * 索引位上的数据对象为基础，都可以构建一个独立的单向链表.
     */
    static class Node<K,V> implements Map.Entry<K,V> {
        // 该属性主要用于存储当前K-V键值对节点排列在HashMap集合中所依据的Hash计算结果
        // 它的赋值过程可以参考HashMap集合中的newNode()方法和replacementNode()方法
        final int hash;
        // 记录当前K-V键值对节点的Key键信息
        // 因为K-V键值对节点在HashMap集合中的排列位置完全参考Key键对象的hashCode()方法的返回值， 
        // 所以K-V键值对节点一旦完成初始化操作，该变量就不允许变更了
        final K key;
        // 记录当前K-V键值对节点的Value值信息
        V value;
        // 因为需要使用Node节点构建单向链表，所以需要next属性存储单向链表中当前节点的下一个节点引用
        Node<K,V> next;

        Node(int hash, K key, V value, Node<K,V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }

        public final K getKey()        { return key; }
        public final V getValue()      { return value; }
        public final String toString() { return key + "=" + value; }

        public final int hashCode() {
            return Objects.hashCode(key) ^ Objects.hashCode(value);
        }

        public final V setValue(V newValue) {
            V oldValue = value;
            value = newValue;
            return oldValue;
        }

        public final boolean equals(Object o) {
            if (o == this)
                return true;

            return o instanceof Map.Entry<?, ?> e
                    && Objects.equals(key, e.getKey())
                    && Objects.equals(value, e.getValue());
        }
    }
    /**
     * 当某个索引位上的链表长度达到指定的阈值(默认为单向链表长度超过 8)时，
     * 单向链表会转化为红黑树;当红黑树中的节点足够少(默认为红黑树中的节点数量少于 6 个) 时，红黑树会转换为单向链表
     */
    static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
        // 当前节点的双亲节点(父节点)
        TreeNode<K,V> parent;  // red-black tree links
        // 当前节点的左儿子节点
        TreeNode<K,V> left;
        // 当前节点的右儿子节点
        TreeNode<K,V> right;
        TreeNode<K,V> prev;    // needed to unlink next upon deletion
        // 当前节点的颜色是红色还是黑色
        boolean red;
        TreeNode(int hash, K key, V val, Node<K,V> next) {
            super(hash, key, val, next);
        }
    }
    /**
     * (h = key.hashCode()) ^ (h >>> 16)
     * hash(Object)方法通过以上表达式得到指定对象的Hash值，这里是取得当前对象的Hash值，
     * 首先进行带符号位的右移 16 位操作(这时候对象 Hash 值的高位段就变成了低位段)，然后与对象原来的Hash值进行异或运算
     */
    static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
    }
    /*
     * tab[i = (n - 1) & hash]
     * 在putVal(int, K, V, boolean, boolean)方法中，通过该表达式得到某个Hash值应该存储
     * 在数组中的哪个索引位上(哪一个桶上);需要注意的是，表达式中的n表示当前数组的长度，
     * 将长度减一后的与运算结果不可能超过 n-1(因为这相当于取余操作)，因此可以确定Hash值代表的当前对象在当前数组中的哪个索引位上
     */
    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }    
}
```
### 为什么严格要求数组大小为2的幂数
:::tip
- 要求容量必须是2的幂次方的原因是为了提高散列（Hash）算法的效率和避免哈希冲突。
- HashMap使用了一种散列算法来将键（Key）映射到存储桶（Bucket）的索引位置。这个索引位置是通过对键的哈希码进行一系列计算得出的。当容量是2的幂次方时，可以使用位运算来代替较慢的取余运算，从而提高计算速度。
- 使用位与运算&可以快速计算出索引位置，因为容量是2的幂次方，其二进制形式的最后几位都是1，而位与运算可以保留哈希码中与容量对应位的值，将其他位的值置为0。
- 容量为2的幂次方还能够更均匀地分布哈希码，减少哈希冲突的概率。如果容量不是2的幂次方，那么使用位与运算时会导致某些索引位置无法访问到，从而导致哈希表中的存储桶没有充分利用。这可能会导致某些桶中的元素数量过多，增加查找和插入操作的时间复杂度。
- 为了保证散列算法的高效性和减少哈希冲突，HashMap严格要求容量必须是2的幂次方，并且在扩容时会将容量扩展为大于当前容量的最小2的幂次方。
:::
### 初始化以及扩容总结
:::warning
#### 初始化
- 默认构造器初始化，默认的负载因子值为0.75，默认大小为16。
- 指定默认大小的构造器进行初始化，会以指定的默认大小最近接近2的幂数的数值进行初始化，例如指定30 初始化为 32。
#### 数据结构
- HashMap 是以数组 + （链表或红黑树）结构存储的。
- 数组 table 的容量并不是 HashMap 集合的容量，因为从数组中的任意一个索引位出发，都可能存在一个单向链表或一棵红黑树;即使在数组中的某些索引位上还没有存储任何 K-V 键值对节点的情况下，数组也会进行扩容操作。
#### 链表转红黑树逻辑
- 转换条件
  1. 在向单向链表中添加新的节点后，链表中的节点总数大于某个值。
  2. HashMap 集合中的 table 数组长度大于 64。
#### 红黑树退化为链表逻辑
- 情况1. 当HashMap集合中的table数组进行扩容操作时
  1. 为了保证依据 K-V 键值对节点中 Key 键信息的 Hash 值，HashMap集合仍然能正确定位到节点存储的数组索引位，
     需要依次对这些索引位上的红黑树进行拆分操作——拆分结果可能形成两棵红黑树，一棵红黑树被引用到原来的索引位上;
     另一棵红黑树被引用到“原索引值 + 原数组长度”号索引位上.
  2. 如果以上两棵红黑树的其中一棵中的节点总数小于或等于 UNTREEIFY_THRESHOLD 常量值(该常量值在 JDK 1.8+中的值为 6)
  ```java
     if (loHead != null) {
        if (lc <= UNTREEIFY_THRESHOLD)
            tab[index] = loHead.untreeify(map);
        else {
            tab[index] = loHead;
            if (hiHead != null) // (else is already treeified)
                loHead.treeify(tab);
        }
    }
    if (hiHead != null) {
        if (hc <= UNTREEIFY_THRESHOLD)
            tab[index + bit] = hiHead.untreeify(map);
        else {
            tab[index + bit] = hiHead;
            if (loHead != null)
                hiHead.treeify(tab);
        }
    }
  ```   
- 情况2. 当使用 HashMap 集合中的 remove(K)方法进行 K-V 键值对节点的移除操作时
  1. 在这种情况下，在 table 数组中，如果某个索引位上移除的红黑树节点足够多，导致根 节点的左儿子节点为 null，
     或者根节点的右儿子节点为 null，甚至根节点本身为 null，那么可以将这棵红黑树转换为单向链表
#### 扩容规则
- 扩容会进行重hash,把一些数据迁移到新的哈希表里面
- 默认的负载因子值为0.75，默认大小为16
- 计算出扩容门槛值为 0.75 * 16 为12 ，当存储的大小等于12的时候 触发扩容机制
- 扩容到 16 * 2 = 32 并且计算出下次触发扩容的门槛值 0.75 * 32 = 24 当存储的大小等于24的时候 会触发下一次扩容
:::
## LinkedHashMap
### 源码分析
```java

public class LinkedHashMap<K,V>
        extends HashMap<K,V>
        implements Map<K,V>
{
    static class Entry<K,V> extends HashMap.Node<K,V> {
        java.util.LinkedHashMap.Entry<K,V> before, after;
        Entry(int hash, K key, V value, Node<K,V> next) {
            super(hash, key, value, next);
        }
    }
    // 双向链表的头节点引用
    transient LinkedHashMap.Entry<K,V> head;
    // 双向链表的尾节点引用，根据前面提到的LinkedHashMap集合中的构造设置，
    / 这里的尾节点可能是最后添加到LinkedHashMap集合中的节点， 
    // 也可能是LinkedHashMap集合中最近被访问的节点
    transient LinkedHashMap.Entry<K,V> tail;

    // 该属性表示LinkedHashMap集合中特有的双向链表中节点的排序特点
    // 如果为 false(默认为 false)，那么按照节点被添加到 LinkedHashMap 集合中的顺序进行排序; 
    // 如果为true，那么按照节点最近被操作(修改操作或读取操作)的顺序进行排序
    final boolean accessOrder;
}
```
### 总结
:::warning
#### 特性
- 根据 LinkedHashMap 集合中每个节点的 before、after 属性形成的双向链表，串联 LinkedHashMap 集合中的所有节点;这些节点在双向链表中的顺序和这些节点处于哪一个 桶结构中，桶结构本身是单向链表结构还是红黑树结构并没有关系，有关系的只是这个节 点代表的 K-V 键值对节点在时间维度上被添加到 LinkedHashMap 集合中的顺序。
- LinkedHashMap 集合中的 head 属性和 tail 属性可以保证被串联的节点可以跨越不同的 桶结构。需要注意的是，根据 LinkedHashMap 集合的初始化设置，head 属性和 tail 属性指 向的节点可能会发生变化。
- LinkedHashMap 可以看作是 `HashMap` 和 `LinkedList` 的结合：它在 HashMap 的基础上添加了一条双向链表，`默认`存储各个元素的插入顺序，但由于这条双向链表，使得 LinkedHashMap 可以实现 `LRU`缓存淘汰策略，因为我们可以设置这条双向链表按照`元素的访问次序`进行排序
- LinkedHashMap 是 HashMap 的子类，所以它具备 HashMap 的所有特点，其次，它在 HashMap 的基础上维护了一条`双向链表`，该链表存储了**所有元素**，`默认`元素的顺序与插入顺序**一致**。若`accessOrder`属性为`true`，则遍历顺序按元素的访问次序进行排序
#### 实现LRU
#### 1.该方法可以移除`最靠近链表头部`的一个节点，而在`get()`方法中可以看到下面这段代码，其作用是挪动结点的位置
```java
protected boolean removeEldestEntry(java.util.Map.Entry<K, V> eldest) {
    return false;
}
```
#### 2.只要调用了`get()`且`accessOrder = true`，则会将该节点更新到链表`尾部`，具体的逻辑在`afterNodeAccess()`中
```java
if (this.accessOrder) {
    this.afterNodeAccess(e);
}
```
#### 3.具体实现
- 指定`accessOrder = true`可以设定链表按照访问顺序排列，通过提供的构造器可以设定`accessOrder`
```java
public LinkedHashMap(int initialCapacity, float loadFactor, boolean accessOrder) {
    super(initialCapacity, loadFactor);
    this.accessOrder = accessOrder;
}
```
- 重写`removeEldestEntry()`方法，内部定义逻辑，通常是判断`容量`是否达到上限，若是则执行淘汰。
#### 自定义实现LRU
```java
class LRUCache {  
    LinkedHashMap<Integer, Integer> map;   
    int capacity;  
    // 使用开启了accessOrder的linkedHashMap，表示其具备访问有序性。 
    public LRUCache(int capacity) { 
        this.capacity = capacity;       
        map = new LinkedHashMap<>(capacity, 0.75f, true);    
    }  
    public int get(int key) { 
        if (map.containsKey(key))      
              return map.get(key);
        return -1;    
    }  
    public void put(int key, int value) {   
         // 先判断是否有这个key  
        if (map.containsKey(key)) {   
                 map.put(key, value);            
                 return;        
                 }
        // 移除第一个元素                  
        if (map.size() == this.capacity) {            
            for (int firstKey : map.keySet()) {               
                 map.remove(firstKey);               
                 break;           
            }        
        }        
        map.put(key, value);   
   }
}  
```
:::
## TreeMap
### 源码分析
```java
public class TreeMap<K,V>
        extends AbstractMap<K,V>
        implements NavigableMap<K,V>, Cloneable, java.io.Serializable
{
 
    // 这个比较器对象非常重要，它记录了红黑树中各节点排列顺序的判定逻辑
    // 该比较器对象可以为null，如果为null，那么在判定红黑树节点的排列顺序时， 
    // 会采用TreeMap集合原生的基于K-V键值对Key-Hash值的判定方式  
    private final Comparator<? super K> comparator;

    // 该变量主要用于记录当前TreeMap集合中红黑树的根节点
    private transient java.util.TreeMap.Entry<K,V> root;

    //该变量主要用于记录当前TreeMap集合中K-V键值对节点的数量
    private transient int size = 0;

    //modCount变量主要用于记录当前TreeMap集合执行写操作的次数
    private transient int modCount = 0;
    
    // 默认的构造方法，会设置TreeMap集合中的比较器对象comparator为null
    // 实例化的TreeMap集合会使用K-V键值对节点的Key键信息的Hash值进行排序
    public TreeMap() {
        comparator = null;
    }
    // 该构造方法可以为当前TreeMap集合对象设置一个比较器对象
    public TreeMap(Comparator<? super K> comparator) {
        this.comparator = comparator;
    }
    // 该构造方法可以将一个特定Map集合中的所有K-V键值对节点复制(引用)到新的TreeMap集合中
    // 因为源集合没有实现SortedMap接口，所以将当前TreeMap集合的比较器对象comparator设置为null
    public TreeMap(Map<? extends K, ? extends V> m) {
        comparator = null;
        putAll(m);
    }
    // 该构造方法可以将一个实现了SortedMap接口的集合中的所有对象复制到新的TreeMap集合中
    // 因为原集合实现了SortedMap接口，所以将源集合使用的比较器对象comparator赋值给当前集合
    public TreeMap(SortedMap<K, ? extends V> m) {
        comparator = m.comparator();
        try {
            buildFromSorted(m.size(), m.entrySet().iterator(), null, null);
        } catch (java.io.IOException | ClassNotFoundException cannotHappen) {
        }
    }
    private void buildFromSorted(int size, Iterator<?> it,
                                 java.io.ObjectInputStream str,
                                 V defaultVal)
            throws  java.io.IOException, ClassNotFoundException {
        this.size = size;
        // 递归进行处理
        root = buildFromSorted(0, 0, size-1, computeRedLevel(size),
                it, str, defaultVal);
    }

    // 该方法中的level变量表示当前正在构建的满二叉树的深度
    // lo变量表示当前子树的第一个节点索引位，在进行第一次递归时从0号索引位开始
    // hi变量表示当前子树的最后一个节点索引位，在进行第一次递归时从size-1号索引位开始 
    // redLevel变量表示红黑树中红节点的起始深度
    private final Entry<K,V> buildFromSorted(int level, int lo, int hi,
                                                               int redLevel,
                                                               Iterator<?> it,
                                                               java.io.ObjectInputStream str,
                                                               V defaultVal)
            throws  java.io.IOException, ClassNotFoundException {
        // 如果条件成立，则说明满二叉树构造完成，返回null
        if (hi < lo) return null;
        // 找到本次遍历集合的中间索引位，代码很好理解:右移一位，表示除以2。
        int mid = (lo + hi) >>> 1;

        Entry<K,V> left  = null;
        // 如果当前子树的最小索引值小于当前确定的中间索引值，
        // 则继续构建下一级子树(以当前中间索引位为根节点的左子树)
        // 在构造下一级左子树时，指定的满二叉树深度+1，子树的起始索引值为0，子树的结束索引值为mid-1
        if (lo < mid)
            left = buildFromSorted(level+1, lo, mid - 1, redLevel,
                    it, str, defaultVal);

        // extract key and/or value from iterator or stream
        K key;
        V value;
        // 以上代码只是确定了子树的索引位，还没有真正开始将集合构建成满二叉树
        // 这里开始进行满二叉树的构建:一共有4种可能的场景
        // 当 it != null、defaultVal == null 时，以 Map.Entry 的形式取得对象，构建本次红黑树的节点 
        // 当it != null、defaultVal != null时，以K-V键值对的形式取得对象，构建本次红黑树的节点
        // key的值来源于it迭代器，value的值默认为defaultVal
        // 当 it == null、defaultVal == null 时，以对象反序列化的形式取得对象，构建本次红黑树的节点
        // key和value的值都来源于str反序列化读取的对象信息
        // 当 it == null、defaultVal != null 时，以对象反序列化的形式取得对象，构建本次红黑树的节点 
        // key的值来源于str反序列化读取的对象信息，value的值采用默认值defaultVal
        if (it != null) {
            if (defaultVal==null) {
                Map.Entry<?,?> entry = (Map.Entry<?,?>)it.next();
                key = (K)entry.getKey();
                value = (V)entry.getValue();
            } else {
                key = (K)it.next();
                value = defaultVal;
            }
        } else { // use stream
            key = (K) str.readObject();
            value = (defaultVal != null ? defaultVal : (V) str.readObject());
        }

        java.util.TreeMap.Entry<K,V> middle =  new java.util.TreeMap.Entry<>(key, value, null);

        // color nodes in non-full bottommost level red
        // 如果当前正在构建的满二叉树的深度刚好是构建满二叉树前计算出的红节点的深度，
        // 则将本次构建的middle节点的颜色设置为红色
        if (level == redLevel)
            middle.color = RED;
        // 如果当前节点的左子树不为null，则将当前节点和它的左子树进行关联
        if (left != null) {
            middle.left = left;
            left.parent = middle;
        }
        // 如果之前计算得到的当前节点的子树的结束索引值大于计算得到的中间索引值，
        // 则以当前middle节点为根节点，构建右子树
        if (mid < hi) {
            java.util.TreeMap.Entry<K,V> right = buildFromSorted(level+1, mid+1, hi, redLevel,
                    it, str, defaultVal);
            middle.right = right;
            right.parent = middle;
        }

        return middle;
    }
     //批量添加
     public void putAll(Map<? extends K, ? extends V> map) {
        int mapSize = map.size();
        // 如果当前TreeMap集合中的K-V键值对节点数量为0，要添加的K-V键值对节点数量不为0，
        // 并且当前传入的Map集合实现了SortedMap接口(说明是有序的Map集合)，则继续进行后续判断
        if (size==0 && mapSize!=0 && map instanceof SortedMap) {
            // 取得传入的有序Map集合的比较器对象comparator
            // 如果比较器对象与当前TreeMap集合使用的比较器对象是同一个对象，
            // 则使用前面介绍的buildFromSorted()方法构建一棵新的红黑树
            // 这意味着不再对在执行该方法前，当前TreeMap集合中已有的K-V键值对节点进行维护
            if (Objects.equals(comparator, ((SortedMap<?,?>)map).comparator())) {
                ++modCount;
                try {
                    buildFromSorted(mapSize, map.entrySet().iterator(),
                                    null, null);
                } catch (java.io.IOException | ClassNotFoundException cannotHappen) {
                }
                return;
            }
        }
        
        // 如果当前TreeMap集合的状态不能使上述两个嵌套的if条件成立，
        // 则对当前批量添加的K-V键值对节点逐一进行操作
        super.putAll(map);
    }
     private void addEntryToEmptyMap(K key, V value) {
        // 在这种情况下，需要进行compare操作，
        // 一个作用是保证当前红黑树使用的compare比较器对方法运行时传入的key是有效的; 
        // 另一个作用是确保key不为null
        compare(key, key); // type (and possibly null) check
        // 创建一个root节点，修改modCount变量代表的操作次数
        // 完成节点添加操作
        root = new Entry<>(key, value, null);
        size = 1;
        modCount++;
    }
    //添加
    //1.通过堆查询的方式找到合适的节点，将新的节点添加成前者的左叶子节点或右叶 子节点。
    //2.节点添加操作可能导致红黑树失去平衡性，需要使红黑树重新恢复平衡性。
    // put()方法中的代码主要用于处理步骤(1)
    // put()方法中调用的fixAfterInsertion()方法主要用于处理步骤(2)
    private V put(K key, V value, boolean replaceOld) {
        Entry<K,V> t = root;
        // 如果该条件成立，则表示当前红黑树为null，即没有红黑树结构
        if (t == null) {
            addEntryToEmptyMap(key, value);
            return null;
        }
        int cmp;
        Entry<K,V> parent;
        // split comparator and comparable paths
        // comparator对象是在TreeMap集合实例化时设置的比较器
        // 根据前文中TreeMap集合的实例化过程，comparator对象可能为null
        Comparator<? super K> cpr = comparator;
        // 如果comparator对象不为null，那么基于这个comparator对象寻找添加节点的位置
        if (cpr != null) {
            do {
                parent = t;
                cmp = cpr.compare(key, t.key);
                // 如果条件成立，则说明要添加的节点的权值小于当前比较的红黑树中节点的权值 
                // 在t节点的左子树中寻找添加节点的位置
                if (cmp < 0)
                    t = t.left;
                // 如果条件成立，则说明要添加的节点的权值大于当前比较的红黑树中节点的权值    
                else if (cmp > 0)
                    t = t.right;
                // 否则说明要添加的节点的权值等于当前比较的红黑树中节点的权值
                // 将节点添加操作转换为节点修改操作    
                else {
                    V oldValue = t.value;
                    if (replaceOld || oldValue == null) {
                        t.value = value;
                    }
                    return oldValue;
                }
            } while (t != null);
        // 如果comparator对象为null，那么基于key自带的comparator对象寻找添加节点的位置 
        // 寻找节点添加位置的逻辑和以上条件代码块的逻辑相同
        } else {
            Objects.requireNonNull(key);
            @SuppressWarnings("unchecked")
            Comparable<? super K> k = (Comparable<? super K>) key;
            do {
                parent = t;
                cmp = k.compareTo(t.key);
                if (cmp < 0)
                    t = t.left;
                else if (cmp > 0)
                    t = t.right;
                else {
                    V oldValue = t.value;
                    if (replaceOld || oldValue == null) {
                        t.value = value;
                    }
                    return oldValue;
                }
            } while (t != null);
        }
        addEntry(key, value, parent, cmp < 0);
        return null;
    }
}
```
### 总结
:::warning
#### 特性
- 基于红黑树,底层是由`红黑树`这种数据结构实现的，所以操作的时间复杂度恒为`O(logN)`,线程不安全
- 默认情况下按照`key`自然排序，另一种是可以通过传入定制的`Comparator`进行自定义规则排序
- TreeMap 可以对`key`进行自然排序或者自定义排序，自定义排序时需要传入`Comparator`，而自然排序要求`key`实现了`Comparable`接口
    ```java
    // 按照 key 自然排序，Integer 的自然排序是升序
    TreeMap<Integer, Object> naturalSort = new TreeMap<>();
    // 定制排序，按照 key 降序排序
    TreeMap<Integer, Object> customSort = new TreeMap<>((o1, o2) -> Integer.compare(o2, o1));
    ```
:::

## HashTable
### 总结
:::warning
#### 特性
- 使用数组+链表,线程安全
- HashTable 默认长度为11，负载因子为0.75，即元素个数达到数组长度的 75% 时，会进行一次扩容，每次扩容为原来数组长度的2倍
:::

## WeakHashMap
### 总结
:::warning
#### 特性
- 使用数组+链表,它依赖普通的`Map`进行实现，是一个非线程安全的集合
- WeakHashMap 日常开发中比较少见，它是基于普通的`Map`实现的，而里面`Entry`中的键在每一次的`垃圾回收`都会被清除掉，所以非常适合用于`短暂访问`、`仅访问一次的元素`，缓存在`WeakHashMap`中，并尽早地把它回收掉
- 默认长度16 2的幂数，负载因子为0.75，即元素个数达到数组长度的 75% 时，会进行一次扩容，每次扩容为原来数组长度的2倍
- 它的键是一种**弱键**，放入 WeakHashMap 时，随时会被回收掉，所以不能确保某次访问元素一定存在
- WeakHashMap 通常作为**缓存**使用，适合存储那些**只需访问一次**、或**只需保存短暂时间**的键值对
:::

## ConcurrentHashMap <Badge text="JUC并发集合-并发版HashMap"/>
### 源码分析
```java
public class ConcurrentHashMap<K,V> extends AbstractMap<K,V>
        implements ConcurrentMap<K,V>, Serializable {
    private static final int MAXIMUM_CAPACITY = 1 << 30;

    /**
     * The default initial table capacity.  Must be a power of 2
     * (i.e., at least 1) and at most MAXIMUM_CAPACITY.
     */
    private static final int DEFAULT_CAPACITY = 16;

    /**
     * The largest possible (non-power of two) array size.
     * Needed by toArray and related methods.
     */
    static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    /**
     * The default concurrency level for this table. Unused but
     * defined for compatibility with previous versions of this class.
     */
    private static final int DEFAULT_CONCURRENCY_LEVEL = 16;

    /**
     * The load factor for this table. Overrides of this value in
     * constructors affect only the initial table capacity.  The
     * actual floating point value isn't normally used -- it is
     * simpler to use expressions such as {@code n - (n >>> 2)} for
     * the associated resizing threshold.
     */
    private static final float LOAD_FACTOR = 0.75f;

    /**
     * The bin count threshold for using a tree rather than list for a
     * bin.  Bins are converted to trees when adding an element to a
     * bin with at least this many nodes. The value must be greater
     * than 2, and should be at least 8 to mesh with assumptions in
     * tree removal about conversion back to plain bins upon
     * shrinkage.
     */
    static final int TREEIFY_THRESHOLD = 8;

    /**
     * The bin count threshold for untreeifying a (split) bin during a
     * resize operation. Should be less than TREEIFY_THRESHOLD, and at
     * most 6 to mesh with shrinkage detection under removal.
     */
    static final int UNTREEIFY_THRESHOLD = 6;

    /**
     * The smallest table capacity for which bins may be treeified.
     * (Otherwise the table is resized if too many nodes in a bin.)
     * The value should be at least 4 * TREEIFY_THRESHOLD to avoid
     * conflicts between resizing and treeification thresholds.
     */
    static final int MIN_TREEIFY_CAPACITY = 64;

    /**
     * Minimum number of rebinnings per transfer step. Ranges are
     * subdivided to allow multiple resizer threads.  This value
     * serves as a lower bound to avoid resizers encountering
     * excessive memory contention.  The value should be at least
     * DEFAULT_CAPACITY.
     */
    private static final int MIN_TRANSFER_STRIDE = 16;

    /**
     * The number of bits used for generation stamp in sizeCtl.
     * Must be at least 6 for 32bit arrays.
     */
    private static final int RESIZE_STAMP_BITS = 16;

    /**
     * The maximum number of threads that can help resize.
     * Must fit in 32 - RESIZE_STAMP_BITS bits.
     */
    private static final int MAX_RESIZERS = (1 << (32 - RESIZE_STAMP_BITS)) - 1;

    /**
     * The bit shift for recording size stamp in sizeCtl.
     */
    private static final int RESIZE_STAMP_SHIFT = 32 - RESIZE_STAMP_BITS;

    /*
     * Encodings for Node hash fields. See above for explanation.
     */
    // 非常重要的桶结构中索引位上头节点的标识
    // MOVED:如果集合结构正在扩容，并且当前桶已经完成了扩容操作中的桶数据对象迁移工作 
    // 那么头节点的Hash值为-1
    static final int MOVED     = -1; // hash for forwarding nodes
    // 如果当前桶结构是红黑树结构，那么头节点的Hash值为-2
    static final int TREEBIN   = -2; // hash for roots of trees
    // 在集合中还有一类节点专门用于进行“占位”操作，这类节点的Hash值为-3
    static final int RESERVED  = -3; // hash for transient reservations
    static final int HASH_BITS = 0x7fffffff; // usable bits of normal node hash

    static final int NCPU = Runtime.getRuntime().availableProcessors();

    static class Node<K,V> implements Map.Entry<K,V> {
        final int hash;
        final K key;
        volatile V val;
        volatile ConcurrentHashMap.Node<K,V> next;

        Node(int hash, K key, V val) {
            this.hash = hash;
            this.key = key;
            this.val = val;
        }

        Node(int hash, K key, V val, ConcurrentHashMap.Node<K,V> next) {
            this(hash, key, val);
            this.next = next;
        }

        public final K getKey()     { return key; }
        public final V getValue()   { return val; }
        public final int hashCode() { return key.hashCode() ^ val.hashCode(); }
        public final String toString() {
            return Helpers.mapEntryToString(key, val);
        }
        public final V setValue(V value) {
            throw new UnsupportedOperationException();
        }

        public final boolean equals(Object o) {
            Object k, v, u; Map.Entry<?,?> e;
            return ((o instanceof Map.Entry) &&
                    (k = (e = (Map.Entry<?,?>)o).getKey()) != null &&
                    (v = e.getValue()) != null &&
                    (k == key || k.equals(key)) &&
                    (v == (u = val) || v.equals(u)));
        }

        /**
         * Virtualized support for map.get(); overridden in subclasses.
         */
        ConcurrentHashMap.Node<K,V> find(int h, Object k) {
            ConcurrentHashMap.Node<K,V> e = this;
            if (k != null) {
                do {
                    K ek;
                    if (e.hash == h &&
                            ((ek = e.key) == k || (ek != null && k.equals(ek))))
                        return e;
                } while ((e = e.next) != null);
            }
            return null;
        }
    }
    
    // 这个属性的意义同HashMap集合中table属性的意义相同
    // 主要用于描述集合内部的主要数组结构
    transient volatile ConcurrentHashMap.Node<K,V>[] table;

    // 主要用于进行集合扩容操作的属性，该属性在扩容过程中负责对扩容后的数组进行引用 
    // 在没有进行扩容操作时，该属性值为null
    private transient volatile ConcurrentHashMap.Node<K,V>[] nextTable;

    // 基础计数器，在没有并发竞争的场景中，主要用于记录当前集合中的数据对象总量
    private transient volatile long baseCount;

    // 非常重要的数组容量控制数值，当集合处于不同的工作状态时，这个数值具有不同的用途
    // 例如，在进行扩容操作时，该数值表示扩容状态，在扩容操作完成后，该数值表示下次扩容的数值计数
    private transient volatile int sizeCtl;

    // 在扩容过程中，每个有效的桶都会被拆分成两个新的桶结构
    // 这个问题已经在讲解HashMap集合时讲解过
    // 该数值为帮助扩容的线程指明了下一个要被拆分的桶所在的索引位
    private transient volatile int transferIndex;

    // 表示目前 CounterCells 数量计数器是否由于某种原因无法工作，0 表示可以工作，1 表示不能工作 
    // 当CounterCells数量计数器被扩容或被初始化时，该值为1，其他时间为0
    private transient volatile int cellsBusy;

    /**
     * Table of counter cells. When non-null, size is a power of 2.
     * 该数组又称为计数盒子，主要用于在高并发场景中进行集合中数据对象数量的计数
     */
    private transient volatile ConcurrentHashMap.CounterCell[] counterCells;

    // views
    private transient ConcurrentHashMap.KeySetView<K,V> keySet;
    private transient ConcurrentHashMap.ValuesView<K,V> values;
    private transient ConcurrentHashMap.EntrySetView<K,V> entrySet;


    /* ---------------- Public operations -------------- */

   
    public ConcurrentHashMap() {
    }

   
    public ConcurrentHashMap(int initialCapacity) {
        this(initialCapacity, LOAD_FACTOR, 1);
    }

  
    public ConcurrentHashMap(Map<? extends K, ? extends V> m) {
        this.sizeCtl = DEFAULT_CAPACITY;
        putAll(m);
    }
    
    public ConcurrentHashMap(int initialCapacity, float loadFactor) {
        this(initialCapacity, loadFactor, 1);
    }
    
    public ConcurrentHashMap(int initialCapacity,
                             float loadFactor, int concurrencyLevel) {
        if (!(loadFactor > 0.0f) || initialCapacity < 0 || concurrencyLevel <= 0)
            throw new IllegalArgumentException();
        if (initialCapacity < concurrencyLevel)   // Use at least as many bins
            initialCapacity = concurrencyLevel;   // as estimated threads
        long size = (long)(1.0 + (long)initialCapacity / loadFactor);
        int cap = (size >= (long)MAXIMUM_CAPACITY) ?
                MAXIMUM_CAPACITY : tableSizeFor((int)size);
        this.sizeCtl = cap;
    }

}
```
### 主要属性
:::warning
#### sizeCtl
- 多个正在同时操作 ConcurrentHashMap 集合的线程，会根据该属性值判断，当前ConcurrentHashMap集合所处的状态，该属性值会在数组初始化、扩容等处理环节影响处理结果。
- 0:表示当前集合的数组还没有初始化。
- -1:表示当前集合正在被初始化。 
- 其他负数:表示当前集合正在进行扩容操作，并且这个负数的低`16`位可表示参与扩容操作的线程数量(`减1`)，后面将进行详细讲解。
- 正整数:表示下次进行扩容操作的阈值(一旦达到这个阈值，就需要进行下一次扩容操作)，并且当前集合并没有进行扩容操作。
#### transferIndex
- ConcurrentHashMap 集合的扩容操作基于`CAS`思想进行设计，并且充分利用了多线程的处理性能。
- 当某个线程发现 ConcurrentHashMap 集合正在进行扩容操作时，可能会参与扩容过程，帮助这个扩容过程尽快完成。
- 扩容过程涉及现有的每个桶中数据对象迁移的问题，而该数值(加 1)主要用于帮助这些线程共享下一个进行数据对象迁移操作的桶结构的索引位。
#### 头节点hash值
- 以上源码片段中每个桶结构头节点的 Hash 值(MOVED、TREEBIN、 RESERVED)都为负数，表示特定处理场景中的节点类型，并且桶结构中没有存储真实的 K-V 键值对节点。
- 而链表结构的头节点的 Hash 值为正常的 Hash 值，并且链 表结构中存储了真实的 K-V 键值对节点
#### baseCount、cellsBusy 和 counterCells
- 当前 ConcurrentHashMap 集合中 K-V 键值对 节点的总数量并不是由一个单一的属性记录的，而是由 3 个属性配合记录的。
- 如果 集合的工作场景并发规模不大，则使用 baseCount 属性进行记录;如果并发规模较 大，则使用 counterCells 数组进行记录。
- cellsBusy 属性主要用于记录和控制 counterCells 数组的工作状态。
:::
### put()方法
put()方法主要用于将一个不为 null 的 K-V 键值对节点添加到集合中，如果集合中已 经存在相同的 Key 键信息，则进行 Value 值信息的替换。
put()方法内部实际上调用了一个putVal()方法，后者主要有 3 个传入参数，并且主要考虑两种添加场景:一种场景是添加某个数组索引位上的节点，即链表结构的根节点;另一种场景是在获得独占操作权的桶结构上添加新的红黑树节点或新的链表节点。

```java
// 该方法主要由put()方法和putIfAbsent()方法进行调用，是添加K-V键值对节点的主要方法 
// key:本次需要添加的K-V键值对节点的Key键信息，不能为null
// value:本次需要添加的K-V键值对的Value值信息，不能为null
// onlyIfAbsent:当发现Key键信息已经存在时，是否要进行替换操作
// 如果该值为false，则表示需要进行替换操作
final V putVal(K key, V value, boolean onlyIfAbsent) {
        if (key == null || value == null) throw new NullPointerException();
        int hash = spread(key.hashCode());
        int binCount = 0;
        // 整个添加过程基于CAS思路进行设计，
        // 在多线程并发场景中，在没有得到可预见的正确操作结果前，会不停重试
        for (Node<K,V>[] tab = table;;) {
            Node<K,V> f; int n, i, fh; K fk; V fv;
            // ======== 以下是第一个处理步骤:
            // 准备集合的内部工作结构，准备符合要求的数组索引位上的第一个Node节点
            // 如果成立，说明ConcurrentHashMap集合的内部数组还没有准备好，那么首先初始化内部数组结构
            if (tab == null || (n = tab.length) == 0)
                tab = initTable();
            // 通过以下代码，依据(n - 1) & hash结果计算出当前K-V键值对节点应该放置于哪一个桶索引位上
            // 如果这个索引位上还没有放置任何节点，则通过CAS操作，在该索引位上添加首个节点
            // 如果节点添加成功，则认为完成了主要的节点添加过程，跳出for循环，不再重试    
            else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                if (casTabAt(tab, i, null, new Node<K,V>(hash, key, value)))
                    break;                   // no lock when adding to empty bin
            }
            // 如果条件成立，则说明当前集合正在进行扩容操作，并且这个桶结构已经完成了数据对象迁移操作 
            // 但整个数据对象迁移过程还没有完成，所以本线程通过helpTransfer()方法加入扩容过程， 
            // 从而帮助整个集合尽快完成所有的扩容操作
            else if ((fh = f.hash) == MOVED)
                tab = helpTransfer(tab, f);
            // 如果条件成立，则说明这个桶结构的头节点和当前要添加的K-V键值对节点相同 
            // 如果没有设置更新要求，则工作结束    
            else if (onlyIfAbsent // check first node without acquiring lock
                     && fh == hash
                     && ((fk = f.key) == key || (fk != null && key.equals(fk)))
                     && (fv = f.val) != null)
                return fv;
            // ======= 以下是第二个处理步骤:
            // 在符合要求的数组索引位上已经具备第一个Node节点的前提下(在特定的桶结构中)，
            // 在使用Object Monitor模式保证当前线程得到第一个Node节点的独占操作权的前提下， 
            // 进行链表结构或红黑树结构中新的K-V键值对节点的添加(或修改)操作    
            else {
                V oldVal = null;
                // synchronized(f)就是对当前桶的操作进行加锁
                // 通过获取桶结构中头节点的独占操作权的方式，获取整个桶结构的独占操作权
                synchronized (f) {
                    // 如果条件不成立，则说明在本线程获得独占操作权前，该桶结构的头节点已经由其他线程添加完毕，
                    // 所以本次操作需要回到for循环的位置进行重试
                    if (tabAt(tab, i) == f) {
                        // 这是第二个步骤可能的第1个处理分支:
                        // 如果满足条件，则说明以当前i号索引位上的节点为起始节点的桶结构是一个链表结构，
                        // 使用该if代码块的逻辑结构完成节点添加(或修改)操作
                        // 该if代码块中的处理逻辑和HashMap集合中对应的处理逻辑一致
                        if (fh >= 0) {
                            binCount = 1;
                            for (Node<K,V> e = f;; ++binCount) {
                                K ek;
                                if (e.hash == hash &&
                                    ((ek = e.key) == key ||
                                     (ek != null && key.equals(ek)))) {
                                    oldVal = e.val;
                                    if (!onlyIfAbsent)
                                        e.val = value;
                                    break;
                                }
                                Node<K,V> pred = e;
                                if ((e = e.next) == null) {
                                    pred.next = new Node<K,V>(hash, key, value);
                                    break;
                                }
                            }
                        }
                        // 这是第二个处理步骤可能的第2个处理分支:
                        // 如果条件成立，则说明以当前i号索引位为起始节点的桶结构是一个红黑树结构
                        // 使用该if代码块的逻辑结构完成节点添加(或修改)操作
                        // 该if代码块中的处理逻辑和HashMap集合中对应的处理逻辑基本一致，此处不再赘述
                        else if (f instanceof TreeBin) {
                            Node<K,V> p;
                            binCount = 2;
                            if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                           value)) != null) {
                                oldVal = p.val;
                                if (!onlyIfAbsent)
                                    p.val = value;
                            }
                        }
                        // 如果头节点为“占位”作用的预留节点，则抛出异常
                        else if (f instanceof ReservationNode)
                            throw new IllegalStateException("Recursive update");
                    }
                }
                // 以下是第三个处理步骤:
                // 在完成节点添加操作后，如果链表结构中的数据对象数量已经满足链表结构向红黑树结构转换的要求， 
                // 那么进行数据结构的转换(当然，在treeifyBin()方法内部还要进行合规判定)
                // 注意:treeifyBin()方法中的转换过程同样需要获取当前桶的独占操作权
                if (binCount != 0) {
                    if (binCount >= TREEIFY_THRESHOLD)
                        treeifyBin(tab, i);
                    if (oldVal != null)
                        return oldVal;
                    break;
                }
            }
        }
        addCount(1L, binCount);
        return null;
}
```
:::warning 使用 putVal()方法进行 K-V 键值对节点的添加操作，主要分为三步
- 定位、验证、初始化操作。定位操作是依据当前 K-V 键值对节点中 Key 键信息的 Hash 值取余后(基于目前数组的长度通过与运算进行取余)的结果，
  确定当前 K-V 键值对 节点在桶结构中的索引位。验证操作是保证当前集合结构和桶结构处于一个正确的状态，可以进行节点添加操作，如果在验证过程中发现集合正在进行扩容操作，则参与扩容操作
  (根据条件)。初始化操作是在集合数组没有初始化的情况下，首先完成集合数组的初始化。 这一步主要基于 CAS 思想进行设计，如果没有达到工作目标，则进行重试。
- 正式的 K-V 键值对节点添加操作。这个操作分为两个场景，如果当前桶结构基于 链表进行数据组织(判定依据是当前桶结构的头节点拥有一个“正常”的 Hash 值“fh >= 0”)， 那么将新的 K-V 键值对节点添加到链表的尾部;如果当前桶结构基于红黑树进行数据组织
  (判定依据是当前桶结构的头节点类型为 TreeBin)，那么使用 putTreeVal()方法，在红黑树 的适当位置添加新的 K-V 键值对节点。如果线程要进行第(2)步操作，则在 Object Monitor 模式下获得当前桶结构的独占操作权。获得桶结构独占操作权的依据是，获得当前桶结构 的头节点的独占操作权。
- 验证桶结构并伺机进行桶结构转换操作。该操作的判定依据和 HashMap 集合中相关 工作的判定依据一致，即当前以链表结构组织的桶中的数据对象数量大于 TREEIFY_THRESHOLD 常量值，并且集合中的 table 数组长度大于 MIN_TREEIFY_CAPACITY 常量值(该判定在 treeifyBin()方法中进行)。
  1. 如果要在 treeifyBin()方法中进行红黑树的转化工作，则必须获得当前桶结构的独占操作权，也就是说，对于同一个桶结构，要么进行节点添加操作，要么进行数据结构转换操作，不可能同时进行两个处理过程。
  2. 和 HashMap 集合的数据处理过程不同的是，ConcurrentHashMap 集合中某个桶结构 上如果是红黑树，那么其头节点(红黑树根节点)的节点类型并不是 TreeNode 而是TreeBin，后者的 Hash 值减 2
:::
在成功完成节点添加操作后，最后需要进行数量计数器的增减操作，并且检查是否需要因为链表中数据对象过多而转换为红黑树，或者是否需要进行数组扩容操作和桶数据对 象迁移操作。这些操作在 treeifyBin()方法和 addCount()方法中进行，并且这些方法在数组 长度小于设置常量值的情况下(小于 MIN_TREEIFY_CAPACITY 的常量值 64)优先进行 数组扩容操作和桶数据对象迁移操作
### 扩容与协助扩容
#### 扩容理论
- ConcurrentHashMap 集合需要找到一种防止重复扩容的方法。这是因为在连续多次的 节点添加操作过程中，很有可能出现两个或更多个线程同时认为 ConcurrentHashMap 集合需要扩容，最后造成 ConcurrentHashMap 集合重复进行同一次扩容操作多次的 情况。
- ConcurrentHashMap 集合工作在多线程并发场景中，可以利用这个特点，在扩容过 程中，特别是在扩容操作的数据对象迁移过程中，让多个线程同时协作，从而加 快数据对象迁移过程。
- ConcurrentHashMap 集合在成功完成新 K-V 键值对节点的添加操作后，还会进行数 量计数器的增加操作，但如果数量计数器只是一个单独的属性，那么势必导致多个 同时完成节点添加操作的线程都在抢占这个计数器进行原子性操作，最终形成较明 显的性能瓶颈。因此 ConcurrentHashMap 集合需要找到一种方法，用于显著降低进 行数量计数器操作时的性能瓶颈。
:::warning ConcurrentHashMap 集合是如何设计扩容操作的呢?
简单来说，就是使用 CAS 技术 避免同一次扩容操作被重复执行多次，采用数据标记的方式(sizeCtl)在各个参与操作 的线程间同步集合状态，同样通过数据标记的方式(transferIndex)指导各个参与线程 协作完成集合扩容操作和数据对象迁移操作，使用计数盒子(counterCells)解决计数器 操作竞争的问题。
:::
#### 扩容过程
1. 在ConcurrentHashMap集合中如何进行扩容操作
   - ConcurrentHashMap 集合中的 addCount()方 法和 treeifyBin()
   - 第一个场景是在某个桶 结构满足红黑树转换的最小数量要求(TREEIFY_THRESHOLD)，但是数组容量还没有达 到最小容量要求(MIN_TREEIFY_CAPACITY)时，会优先进行扩容操作
   - 第二个场景是 在成功进行了一个新的 K-V 键值对节点的添加操作后，正在进行数量计数器的增加操作时， 发现增加后的计数器值已经大于 sizeCtl 属性的值。sizeCtl 属性的值最初可以是根据负载因 子计算得到的值，也可以是上次扩容操作计算出的下次扩容的阈值。
2. 使用 sizeCtl 属性巧妙地记录扩容过程
3. CounterCell 并发计数
4. transfer() 实现多线程扩容,当put的时候发现数组正在扩容,会执行helpTransfer()方法,让put 线程帮助进行扩容
## ConcurrentSkipListMap <Badge text="JUC并发集合-基于SkipList的有序Map"/>
### 说明
1. ConcurrentSkipListMap是一个基于SkipList实现的线程安全的有序存储的Map
2. 默认情况下根据key自然排序(Comparable)，或者根据在Map进行创建时提供的比较器进行自定义排序(Comparator)。同样，该类不允许key或者value为null
3. ConcurrentSkipListMap 的数据结构横向纵向都是链表
